import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import { useTripStore } from '../store/tripStore';
import { chatAPI } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { destination, fromCity, days, travellers, travellerType, totalBudgetPerDay, budgetResult, selectedHotel } = useTripStore();
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your TripWise AI concierge for ${destination}. Ask me anything about your budget, transport, or local tips!` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    Keyboard.dismiss();

    const newMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const context = {
        destination,
        fromCity,
        days,
        travellers,
        travellerType,
        totalBudget: totalBudgetPerDay,
        hotelName: selectedHotel?.name,
        budgetResult,
      };

      const res = await chatAPI.send(userText, context, messages.slice(1)) as any;
      
      setMessages([...newMessages, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the server right now. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top, paddingBottom: Platform.OS === 'ios' ? insets.bottom : Layout.md }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.cream} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>✨ TripWise AI</Text>
          <Text style={styles.headerSub}>Expert guide for {destination}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Chat Area ── */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea} 
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg, idx) => (
          <View key={idx} style={[
            styles.messageBubble,
            msg.role === 'user' ? styles.userBubble : styles.aiBubble
          ]}>
            {msg.role === 'assistant' && (
              <View style={styles.aiAvatar}>
                <Text style={{ fontSize: 16 }}>✨</Text>
              </View>
            )}
            <View style={[
              styles.messageContent,
              msg.role === 'user' ? styles.userContent : styles.aiContent
            ]}>
              <Text style={[
                styles.messageText,
                msg.role === 'user' ? styles.userText : styles.aiText
              ]}>{msg.content}</Text>
            </View>
          </View>
        ))}
        
        {isLoading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.aiAvatar}>
              <Text style={{ fontSize: 16 }}>✨</Text>
            </View>
            <View style={[styles.messageContent, styles.aiContent, { paddingVertical: 14 }]}>
              <ActivityIndicator size="small" color={Colors.gold} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input Area ── */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your trip..."
          placeholderTextColor={Colors.creamSubtle}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} 
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Ionicons name="send" size={18} color={Colors.navy} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.md, paddingVertical: Layout.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.navyBorder,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontFamily: Typography.sansBold, fontSize: Layout.md, color: Colors.cream },
  headerSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginTop: 2 },
  
  chatArea: { flex: 1 },
  chatContent: { padding: Layout.md, gap: Layout.md, paddingBottom: Layout.xl },
  
  messageBubble: { flexDirection: 'row', maxWidth: '85%', alignItems: 'flex-end', gap: 8 },
  userBubble: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  aiBubble: { alignSelf: 'flex-start' },
  
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.navyCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.gold + '40', marginBottom: 4 },
  
  messageContent: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userContent: { backgroundColor: Colors.gold, borderBottomRightRadius: 4 },
  aiContent: { backgroundColor: Colors.navyCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  
  messageText: { fontFamily: Typography.sans, fontSize: Typography.sm, lineHeight: 22 },
  userText: { color: Colors.navy },
  aiText: { color: Colors.cream },
  
  inputContainer: { 
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, 
    paddingHorizontal: Layout.md, paddingVertical: Layout.sm,
    borderTopWidth: 1, borderTopColor: Colors.navyBorder,
    backgroundColor: Colors.navy,
  },
  input: {
    flex: 1, backgroundColor: Colors.navyCard, borderRadius: 20,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    minHeight: 44, maxHeight: 120,
    color: Colors.cream, fontFamily: Typography.sans, fontSize: Typography.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
});
