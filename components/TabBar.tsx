import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type TabBarProps = {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
};

const TabBar = ({ currentTab, setCurrentTab }: TabBarProps) => {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tabItem, currentTab === 'schedule' && styles.activeTab]} 
        onPress={() => setCurrentTab('schedule')}
      >
        <Text style={styles.tabIcon}>📅</Text>
        <Text style={styles.tabText}>Lịch</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabItem, currentTab === 'suggestions' && styles.activeTab]} 
        onPress={() => setCurrentTab('suggestions')}
      >
        <Text style={styles.tabIcon}>🧠</Text>
        <Text style={styles.tabText}>Gợi ý</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabItem, currentTab === 'analytics' && styles.activeTab]} 
        onPress={() => setCurrentTab('analytics')}
      >
        <Text style={styles.tabIcon}>📊</Text>
        <Text style={styles.tabText}>Phân tích</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: "#7B66FF",
    paddingTop: 5,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  }
});

export default TabBar;