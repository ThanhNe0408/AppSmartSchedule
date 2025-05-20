import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../../SmartSchedulerApp';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
}

const priorityColors = {
  low: '#4CAF50',      // Green
  medium: '#FFC107',   // Yellow
  high: '#F44336',     // Red
};

const TasksScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Hoàn thành bài tập lớn',
      completed: false,
      priority: 'high',
      dueDate: new Date(2025, 4, 5),
    },
    {
      id: '2',
      title: 'Đọc tài liệu',
      completed: true,
      priority: 'medium',
      dueDate: new Date(2025, 4, 3),
    },
    {
      id: '3',
      title: 'Mua sách giáo khoa',
      completed: false,
      priority: 'low',
      dueDate: null,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'completed'>('all');

  const toggleTaskCompletion = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa nhiệm vụ này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setTasks(tasks.filter((task) => task.id !== id));
          },
        },
      ]
    );
  };

  const addNewTask = () => {
    if (taskInput.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhiệm vụ');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskInput.trim(),
      completed: false,
      priority: selectedPriority,
      dueDate: null,
    };

    setTasks([...tasks, newTask]);
    setTaskInput('');
    setSelectedPriority('medium');
    setModalVisible(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterType === 'all') return true;
    if (filterType === 'active') return !task.completed;
    if (filterType === 'completed') return task.completed;
    return true;
  });

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checkboxChecked]}
        onPress={() => toggleTaskCompletion(item.id)}
      >
        {item.completed && <Icon name="check" size={18} color="#fff" />}
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text style={[
          styles.taskTitle,
          item.completed && styles.taskTitleCompleted
        ]}>
          {item.title}
        </Text>
        
        {item.dueDate && (
          <View style={styles.taskDueDate}>
            <Icon name="event" size={14} color="#888" />
            <Text style={styles.taskDueDateText}>{formatDate(item.dueDate)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.taskActions}>
        <View 
          style={[
            styles.priorityIndicator, 
            { backgroundColor: priorityColors[item.priority] }
          ]} 
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteTask(item.id)}
        >
          <Icon name="delete-outline" size={22} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhiệm vụ</Text>
        <TouchableOpacity>
          <Icon name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'active' && styles.filterButtonActive]}
          onPress={() => setFilterType('active')}
        >
          <Text style={[styles.filterText, filterType === 'active' && styles.filterTextActive]}>
            Đang làm
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilterType('completed')}
        >
          <Text style={[styles.filterText, filterType === 'completed' && styles.filterTextActive]}>
            Hoàn thành
          </Text>
        </TouchableOpacity>
      </View>

      {filteredTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="assignment" size={64} color="#ddd" />
          <Text style={styles.emptyStateText}>Không có nhiệm vụ nào</Text>
          <Text style={styles.emptyStateSubText}>
            Thêm nhiệm vụ mới để theo dõi công việc của bạn
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tasksList}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal Add Task */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm nhiệm vụ mới</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.taskInputField}
              placeholder="Nhập tên nhiệm vụ"
              value={taskInput}
              onChangeText={setTaskInput}
              autoFocus
            />

            <Text style={styles.priorityLabel}>Mức độ ưu tiên:</Text>
            <View style={styles.prioritySelector}>
              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  styles.lowPriority,
                  selectedPriority === 'low' && styles.selectedPriority,
                ]}
                onPress={() => setSelectedPriority('low')}
              >
                <Text style={styles.priorityText}>Thấp</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  styles.mediumPriority,
                  selectedPriority === 'medium' && styles.selectedPriority,
                ]}
                onPress={() => setSelectedPriority('medium')}
              >
                <Text style={styles.priorityText}>Trung bình</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  styles.highPriority,
                  selectedPriority === 'high' && styles.selectedPriority,
                ]}
                onPress={() => setSelectedPriority('high')}
              >
                <Text style={styles.priorityText}>Cao</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addTaskButton} onPress={addNewTask}>
              <Text style={styles.addTaskButtonText}>Thêm nhiệm vụ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#4285F4',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  tasksList: {
    padding: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#4285F4',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskDueDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDueDateText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  taskInputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  lowPriority: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  mediumPriority: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  highPriority: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  selectedPriority: {
    borderColor: '#333',
  },
  priorityText: {
    fontWeight: '500',
  },
  addTaskButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTaskButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TasksScreen;