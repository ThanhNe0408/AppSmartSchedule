import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image
} from "react-native";
import { COLORS } from "../../styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from '@react-native-firebase/firestore';

// Định nghĩa các kiểu dữ liệu
interface ScheduleItem {
  id: string;
  title: string;
  type: 'class' | 'study' | 'exam' | 'break';
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  location?: string;
  priority?: number;
  completed?: boolean;
  notes?: string;
}

interface StudySession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  subject: string;
  efficiency: number;
  notes?: string;
}

interface UserData {
  schedule: ScheduleItem[];
  studySessions: StudySession[];
  preferences: {
    preferredStudyTime?: 'morning' | 'afternoon' | 'evening' | 'night';
    breakDuration?: number;
    studyGoalPerDay?: number;
    focusLevel?: number;
  };
}

const EMPTY_USER_DATA: UserData = {
  schedule: [],
  studySessions: [],
  preferences: {}
};

const AIAssistant = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserData>(EMPTY_USER_DATA);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([
    { role: 'assistant', content: 'Xin chào! Mình là Mimi 🐱, trợ lý học tập dễ thương của bạn. Hãy hỏi Mimi bất cứ điều gì về lịch học, quản lý thời gian hoặc thử thách nhé!' }
  ]);

  // Định nghĩa các biến cần thiết
  const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  const busyHoursByDay = [0, 0, 0, 0, 0, 0, 0];

  // Lấy dữ liệu từ Firestore
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId') || 'demo_user';
        // Lấy lịch học từ collection 'events'
        const eventsSnap = await firestore()
          .collection('events')
          .where('userId', '==', userId)
          .get();

        const schedule: ScheduleItem[] = eventsSnap.docs.map(doc => {
          const d = doc.data();
          // Tính dayOfWeek từ date (nếu có)
          let dayOfWeek = 0;
          if (d.date) {
            let dateObj;
            if (typeof d.date === 'string') {
              const [year, month, day] = d.date.split('-').map(Number);
              dateObj = new Date(year, month - 1, day);
            } else if (d.date.toDate) {
              dateObj = d.date.toDate();
            } else {
              dateObj = new Date(d.date);
            }
            dayOfWeek = dateObj.getDay();
          } else if (d.day) {
            dayOfWeek = Number(d.day);
          }
          return {
            id: doc.id,
            title: d.title,
            type: d.id?.startsWith('class') ? 'class' : (d.id?.startsWith('exam') ? 'exam' : 'study'),
            startTime: d.startTime,
            endTime: d.endTime,
            dayOfWeek,
            location: d.info,
            priority: 1,
            notes: d.info,
          };
        });

        // Lấy thử thách từ collection 'challenges' nếu muốn
        const challengeSnap = await firestore()
          .collection('challenges')
          .where('userId', '==', userId)
          .get();

        const studySessions: StudySession[] = challengeSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            date: d.date,
            startTime: d.startTime,
            endTime: d.endTime,
            duration: d.duration,
            subject: d.subject,
            efficiency: d.efficiency,
            notes: d.notes,
          };
        });

        setUserData({ schedule, studySessions, preferences: {} });
        setIsFirstLaunch(false);
      } catch (error) {
        console.error("Error loading user data from Firebase:", error);
        setUserData(EMPTY_USER_DATA);
      }
    };
    loadUserData();
  }, []);

  // Hàm gọi API OpenRouter
  const callOpenRouterAPI = async (messages: Array<{role: string, content: string}>) => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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',
          'HTTP-Referer': 'https://github.com/yourusername/SmartSchedule',
          'X-Title': 'SmartSchedule',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  };

  // Hàm gửi câu hỏi và nhận phản hồi AI
  const generateResponse = async () => {
    if (!prompt.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập câu hỏi hoặc yêu cầu");
      return;
    }
    setIsLoading(true);
    try {
      // Thêm câu hỏi vào chatHistory
      const userMessage = { role: 'user', content: prompt };
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);
      setPrompt("");

      // Tạo context từ dữ liệu người dùng
      let context = "";
      if (userData.schedule.length > 0) {
        context = `Dựa trên lịch học hiện tại của người dùng:\n`;
        userData.schedule.forEach(item => {
          context += `- ${dayNames[item.dayOfWeek]}: ${item.title} (${item.startTime} - ${item.endTime})\n`;
        });
      }
      if (userData.studySessions.length > 0) {
        context += `\nCác thử thách/challenge gần đây:\n`;
        userData.studySessions.forEach(item => {
          context += `- ${item.date}: ${item.subject} (${item.startTime} - ${item.endTime}), hiệu suất: ${item.efficiency}/10\n`;
        });
      }
      const systemMessage = {
        role: 'system',
        content: `Bạn là Mimi, một trợ lý AI mèo dễ thương chuyên giúp đỡ học sinh/sinh viên trong việc quản lý thời gian, tối ưu lịch học và thử thách học tập. ${context} Hãy trả lời câu hỏi của người dùng một cách hữu ích, thân thiện và dễ thương.`
      };
      const messages = [systemMessage, ...updatedHistory];
      const aiResponse = await callOpenRouterAPI(messages);
      setChatHistory([...updatedHistory, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo phản hồi. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mimi - Trợ lý học tập dễ thương 🐱</Text>
      <Text style={styles.description}>
            Trò chuyện với Mimi để tối ưu lịch học, quản lý thời gian, hỏi đáp mọi vấn đề liên quan đến học tập và thử thách!
      </Text>
        </View>

        {/* Box chat */}
        <View style={styles.chatBox}>
          {chatHistory.map((msg, idx) => (
            <View key={idx} style={msg.role === 'user' ? styles.userMsg : styles.aiMsg}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                {msg.role === 'assistant' && (
                  <Image source={require('../../assets/cat.png')} style={{ width: 24, height: 24, marginRight: 6 }} />
                )}
                <Text style={styles.msgRole}>{msg.role === 'assistant' ? 'Mimi:' : 'Bạn:'}</Text>
              </View>
              <Text style={styles.msgText}>
                {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
              </Text>
            </View>
          ))}
          {isLoading && (
            <View style={styles.aiMsg}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Image source={require('../../assets/cat.png')} style={{ width: 24, height: 24, marginRight: 6 }} />
                <Text style={styles.msgRole}>Mimi:</Text>
              </View>
              <ActivityIndicator size="small" color="#4CAF50" />
            </View>
          )}
        </View>

        {/* Nhập câu hỏi */}
              <View style={styles.inputContainer}>
                <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi cho Mimi..."
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendButton, !prompt.trim() && styles.disabledButton]}
                  onPress={generateResponse}
                  disabled={!prompt.trim() || isLoading}
                >
                    <Text style={styles.sendButtonText}>Gửi</Text>
                </TouchableOpacity>
          </View>

        {/* Gợi ý câu hỏi */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Gợi ý cho Mimi</Text>
          <TouchableOpacity style={styles.suggestionItem} onPress={() => setPrompt("Làm thế nào để tối ưu lịch học của mình?")}>
            <Text style={styles.suggestionIcon}>��</Text>
            <Text style={styles.suggestionText}>Tối ưu lịch học</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionItem} onPress={() => setPrompt("Gợi ý cách quản lý thời gian hiệu quả")}> 
            <Text style={styles.suggestionIcon}>⏰</Text>
            <Text style={styles.suggestionText}>Quản lý thời gian</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionItem} onPress={() => setPrompt("Làm sao để cân bằng giữa học tập và giải trí?")}>
            <Text style={styles.suggestionIcon}>⚖️</Text>
            <Text style={styles.suggestionText}>Cân bằng học tập và giải trí</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionItem} onPress={() => setPrompt("Đề xuất thử thách học tập hiệu quả")}> 
            <Text style={styles.suggestionIcon}>🎯</Text>
            <Text style={styles.suggestionText}>Thử thách học tập</Text>
          </TouchableOpacity>
            </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    textAlignVertical: "top",
  },
  sendButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  suggestionsContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: "#666666",
  },
  chatBox: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minHeight: 120,
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderRadius: 8,
    marginVertical: 4,
    padding: 8,
    maxWidth: '80%',
  },
  aiMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 4,
    padding: 8,
    maxWidth: '80%',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  msgRole: {
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#4CAF50',
  },
  msgText: {
    fontSize: 14,
    color: '#333',
  },
});

export default AIAssistant;