import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import Card from "../UI/Card";
import CustomButton from "../UI/CustomButton";
import ToggleSwitch from "../UI/ToggleSwitch";
import AnalyticItem from "../analytics/AnalyticItem";
import ReminderSetting from "../analytics/ReminderSetting";

const AnalyticsTab = () => {
  const [voiceReminder, setVoiceReminder] = useState(false);
  const [earlyReminder, setEarlyReminder] = useState(true);
  const [autoAdjust, setAutoAdjust] = useState(true);
  
  return (
    <ScrollView>
      <Card title="📊 Phân tích lịch trình">
        <View style={styles.analyticsContainer}>
          <AnalyticItem 
            iconText="✓"
            value="85%"
            label="Nhiệm vụ hoàn thành"
            circleColor="#4CAF50"
          />
          
          <AnalyticItem 
            iconText="⏰"
            value="6.5"
            label="Giờ học tập/ngày"
            circleColor="#FF9800"
          />
          
          <AnalyticItem 
            iconText="🎯"
            value="3/4"
            label="Mục tiêu đạt được"
            circleColor="#2196F3"
          />
        </View>
      </Card>
      
      <Card title="🔔 Nhắc nhở thông minh">
        <View style={styles.reminderContainer}>
          <ReminderSetting 
            label="Nhắc nhở bằng giọng nói"
            isActive={voiceReminder}
            onToggle={() => setVoiceReminder(!voiceReminder)}
          />
          
          <ReminderSetting 
            label="Nhắc nhở trước 15 phút"
            isActive={earlyReminder}
            onToggle={() => setEarlyReminder(!earlyReminder)}
          />
          
          <ReminderSetting 
            label="Tự động điều chỉnh"
            isActive={autoAdjust}
            onToggle={() => setAutoAdjust(!autoAdjust)}
          />
        </View>
        
        <CustomButton
          title="Tối ưu lịch trình tuần"
          onPress={() => {}}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  analyticsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  reminderContainer: {
    marginVertical: 16,
  }
});

export default AnalyticsTab;