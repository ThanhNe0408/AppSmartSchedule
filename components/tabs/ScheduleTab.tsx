import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import Card from "../UI/Card";
import CustomButton from "../UI/CustomButton";
import EventItem from "../schedule/EventItem";
import TimelineItem from "../schedule/TimelineItem";

const ScheduleTab = () => {
  return (
    <ScrollView>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Xin chào, Sinh viên!</Text>
        <Text style={styles.dateText}>Thứ 2, 13 tháng 4</Text>
      </View>
      
      <Card title="📅 Lịch học / Lịch thi" showSeeAll onSeeAllPress={() => {}}>
        <View style={styles.importOptionsContainer}>
          <CustomButton 
            title="Google Calendar" 
          
            onPress={() => {}} 
            style={styles.importButton}
          />
          <CustomButton 
            title="Tải file PDF" 
            
            onPress={() => {}} 
            style={styles.importButton}
          />
          <CustomButton 
            title="Quét ảnh" 
          
            onPress={() => {}} 
            style={styles.importButton}
          />
        </View>
        
        <EventItem 
          day="13"
          month="Th.4"
          title="Kiểm tra giữa kỳ"
          info="Phòng A2.5 • 7:30 - 9:30"
          indicatorColor="#FF5252"
        />
        
        <EventItem 
          day="15"
          month="Th.4"
          title="Lớp Cấu trúc dữ liệu"
          info="Phòng B1.3 • 13:00 - 16:00"
          indicatorColor="#4285F4"
        />
      </Card>
      
      <Card title="⏳ Thời gian biểu hôm nay">
        <View style={styles.timelineContainer}>
          <TimelineItem 
            time="07:30 - 09:30"
            title="Học Toán cao cấp"
            location="Phòng C2.5"
            pointColor="#4285F4"
          />
          
          <TimelineItem 
            time="10:00 - 11:30"
            title="Làm bài tập nhóm"
            location="Thư viện"
            pointColor="#FF9800"
          />
          
          <TimelineItem 
            time="13:00 - 15:30"
            title="Thực hành lập trình"
            location="Phòng máy A4"
            pointColor="#9C27B0"
            isLast={true}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  importOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  importButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  timelineContainer: {
    paddingVertical: 8,
    position: "relative",
  }
});

export default ScheduleTab;