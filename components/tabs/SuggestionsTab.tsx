import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Card from "../UI/Card";
import CustomButton from "../UI/CustomButton";

const SuggestionsTab = () => {
  const [task, setTask] = useState('');
  
  return (
    <ScrollView>
      <Card title="🧠 Gợi ý lịch trình thông minh">
        <View style={styles.inputContainer}>
          <TextInput 
            placeholder="Nhập công việc cần hoàn thành..." 
            style={styles.input}
            value={task}
            onChangeText={setTask}
          />
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.suggestionOptions}>
          <TouchableOpacity style={styles.suggestionTag}>
            <Text style={styles.suggestionTagText}>Bài tập về nhà</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionTag}>
            <Text style={styles.suggestionTagText}>Bài thuyết trình</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionTag}>
            <Text style={styles.suggestionTagText}>Đọc sách</Text>
          </TouchableOpacity>
        </View>
        
        <CustomButton
          title="Gợi ý thời gian tối ưu"
          onPress={() => {}}
        />
      </Card>
      
      <Card title="⏱️ Dự đoán thời gian hoàn thành">
        <View style={styles.predictionResult}>
          <View style={styles.predictionCircle}>
            <Text style={styles.predictionValue}>45</Text>
            <Text style={styles.predictionUnit}>phút</Text>
          </View>
          <View style={styles.predictionDetails}>
            <Text style={styles.predictionTitle}>Bài tập Toán cao cấp</Text>
            <Text style={styles.predictionDescription}>
              Dựa trên các bài tập tương tự bạn đã hoàn thành trước đây
            </Text>
          </View>
        </View>
        <CustomButton
          title="Phân tích chi tiết"
         
          
          onPress={() => {}}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 4,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  searchButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: {
    fontSize: 18,
  },
  suggestionOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  suggestionTag: {
    backgroundColor: "#F0F2F5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionTagText: {
    fontSize: 13,
    color: "#333",
  },
  predictionResult: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  predictionCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7B66FF",
  },
  predictionUnit: {
    fontSize: 12,
    color: "#7B66FF",
  },
  predictionDetails: {
    flex: 1,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  predictionDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  }
});

export default SuggestionsTab;

