import { useState } from 'react'
import { Image } from 'react-native'
import * as tf from '@tensorflow/tfjs'
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native'
import type { ScheduleTokenizer } from './tokenizer.js'
import { loadTokenizer } from './tokenizer.js'

interface ScheduleEvent {
  day: string
  period: string
  subject: string
  room: string
  instructor: string
  group: string
  time: string
}

interface PredictionOutput {
  day: string;
  period: string;
  subject: string;
  room: string;
  instructor: string;
  group: string;
  time: string;
}

export class ScheduleRecognitionModel {
  private model: tf.LayersModel | null = null
  private tokenizer: ScheduleTokenizer | null = null
  private isModelLoaded: boolean = false

  constructor() {
    this.initModel()
  }

  private async initModel() {
    try {
      // Load model
      await tf.ready()
      
      // Load the fine-tuned LayoutLMv3 model
      const modelJson = require('./assets/model/model.json')
      const modelWeights = require('./assets/model/weights.bin')
      this.model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights))

      // Load tokenizer
      this.tokenizer = await loadTokenizer()
      
      this.isModelLoaded = true
      console.log('Model and tokenizer loaded successfully')
    } catch (error) {
      console.error('Error loading model:', error)
    }
  }

  private async preprocessImage(imageUri: string) {
    // Load and preprocess image
    const response = await fetch(imageUri)
    const imageData = await response.arrayBuffer()
    const imageTensor = decodeJpeg(new Uint8Array(imageData))

    // Resize image to model input size (224x224)
    const resized = tf.image.resizeBilinear(imageTensor, [224, 224])
    
    // Normalize pixel values
    const normalized = resized.div(255.0)
    
    // Add batch dimension
    const batched = normalized.expandDims(0)
    
    return batched
  }

  private async extractLayoutFeatures(image: tf.Tensor) {
    // Extract layout features using LayoutLMv3's visual backbone
    const features = this.model!.predict(image) as tf.Tensor
    return features
  }

  private async tokenizeText(text: string) {
    if (!this.tokenizer) {
      throw new Error('Tokenizer not initialized')
    }
    // Tokenize text using the loaded tokenizer
    const tokens = await this.tokenizer.tokenize(text)
    return tokens
  }

  private postprocessPredictions(predictions: tf.Tensor): ScheduleEvent[] {
    const events: ScheduleEvent[] = []
    
    try {
      // First convert to a JavaScript array and ensure it's the right shape
      const rawPredictions = predictions.arraySync()
      
      // Ensure we have a 2D array where each inner array represents one prediction
      if (!Array.isArray(rawPredictions)) {
        throw new Error('Unexpected prediction format: not an array')
      }

      // Handle both single prediction and batch prediction cases
      const predictionRows = Array.isArray(rawPredictions[0]) ? rawPredictions : [rawPredictions]
      
      // Process each prediction row
      for (const row of predictionRows) {
        if (!Array.isArray(row)) {
          throw new Error('Unexpected prediction format: row is not an array')
        }

        // Convert numerical values to strings and map to fields
        const values = row.map(val => String(val))
        if (values.length < 7) {
          throw new Error('Unexpected prediction format: insufficient values')
        }

        events.push({
          day: values[0],
          period: values[1],
          subject: values[2],
          room: values[3],
          instructor: values[4],
          group: values[5],
          time: values[6]
        })
      }
    } catch (error) {
      console.error('Error processing predictions:', error)
      throw new Error('Failed to process model predictions')
    }
    
    return events
  }

  public async recognizeSchedule(imageUri: string): Promise<ScheduleEvent[]> {
    if (!this.isModelLoaded) {
      throw new Error('Model not loaded')
    }

    try {
      // Preprocess image
      const processedImage = await this.preprocessImage(imageUri)
      
      // Extract layout features
      const layoutFeatures = await this.extractLayoutFeatures(processedImage)
      
      // Get model predictions
      const predictions = this.model!.predict(layoutFeatures) as tf.Tensor
      
      // Post-process predictions
      const scheduleEvents = this.postprocessPredictions(predictions)
      
      // Cleanup tensors
      tf.dispose([processedImage, layoutFeatures, predictions])
      
      return scheduleEvents
    } catch (error) {
      console.error('Error recognizing schedule:', error)
      throw error
    }
  }
}

// Training configuration for fine-tuning
export const trainingConfig = {
  epochs: 10,
  batchSize: 8,
  learningRate: 2e-5,
  modelConfig: {
    maxSeqLength: 512,
    imageSize: 224,
    hiddenSize: 768,
    numAttentionHeads: 12,
    intermediateSize: 3072,
    hiddenDropoutProb: 0.1,
    attentionProbDropoutProb: 0.1
  }
}

// Example usage:
/*
const model = new ScheduleRecognitionModel()
const events = await model.recognizeSchedule(imageUri)
*/ 