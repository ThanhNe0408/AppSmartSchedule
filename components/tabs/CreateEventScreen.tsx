import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Button, Alert } from "react-native";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const CreateEventScreen = ({ navigation }: Props) => {
  const [title, setTitle] = useState('');
  const [info, setInfo] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');

  const handleSave = async () => {
    try {
      await firestore().collection('events').add({ 
        title, 
        info, 
        day, 
        month,
        createdAt: firestore.FieldValue.serverTimestamp()
      });
      Alert.alert("Thành công", "Đã tạo lịch thành công!");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Lỗi", "Tạo lịch thất bại: " + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tên sự kiện:</Text>
      <TextInput 
        style={styles.input} 
        value={title} 
        onChangeText={setTitle}
        placeholder="Nhập tên sự kiện" 
      />
      
      <Text style={styles.label}>Thông tin:</Text>
      <TextInput 
        style={styles.input} 
        value={info} 
        onChangeText={setInfo}
        placeholder="Nhập thông tin chi tiết"
        multiline 
      />
      
      <Text style={styles.label}>Ngày:</Text>
      <TextInput 
        style={styles.input} 
        value={day} 
        onChangeText={setDay} 
        keyboardType="numeric"
        placeholder="Nhập ngày (1-31)" 
      />
      
      <Text style={styles.label}>Tháng:</Text>
      <TextInput 
        style={styles.input} 
        value={month} 
        onChangeText={setMonth}
        keyboardType="numeric"
        placeholder="Nhập tháng (1-12)" 
      />
      
      <Button title="Lưu lịch" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  label: { 
    fontWeight: "bold", 
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
});

export default CreateEventScreen;
