import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { cafeterias } from '../data/cafeterias';
import { useNetwork } from '../providers/NetworkProvider';
import { useSupport, type SupportCategory } from '../providers/SupportProvider';

const NAVY = '#172B4D';
const CATEGORIES: SupportCategory[] = ['Wallet', 'Payment', 'Order', 'App & Network', 'Other'];

export default function SupportScreen() {
  const { tickets, hydrated, submitRequest } = useSupport();
  const { isOnline, isChecking } = useNetwork();
  const [category, setCategory] = useState<SupportCategory>('Payment');
  const [cafeteria, setCafeteria] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submitRequest({ category, cafeteria, orderReference, description });
      if (!result.success) {
        Alert.alert('Request not saved', result.message);
        return;
      }
      setDescription('');
      setOrderReference('');
      setCafeteria('');
      setShowHistory(true);
      Alert.alert('Saved on This Device', `Reference: ${result.id}\n\n${result.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>Report problems with orders, payments, wallet funding or the app.</Text>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Prototype support — local only</Text>
        <Text style={styles.noticeText}>Requests are saved on this device for HCI testing. They are NOT sent to cafeteria staff or IT support, even when you are online.</Text>
        <Text style={styles.connection}>{isChecking ? 'Checking connection…' : isOnline ? 'Connected' : 'Offline — you can still save a request'}</Text>
      </View>
      <Text style={styles.section}>What went wrong?</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((option) => (
          <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: category === option }}
            style={[styles.chip, category === option && styles.selectedChip]} onPress={() => setCategory(option)}>
            <Text style={[styles.chipText, category === option && styles.selectedChipText]}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Cafeteria (optional)</Text>
      <View style={styles.chips}>
        <Pressable style={[styles.chip, !cafeteria && styles.selectedChip]} onPress={() => setCafeteria('')}>
          <Text style={[styles.chipText, !cafeteria && styles.selectedChipText]}>Not applicable</Text>
        </Pressable>
        {cafeterias.map((store) => (
          <Pressable key={store.id} style={[styles.chip, cafeteria === store.name && styles.selectedChip]}
            onPress={() => setCafeteria(store.name)}>
            <Text style={[styles.chipText, cafeteria === store.name && styles.selectedChipText]}>{store.name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Order or payment reference (optional)</Text>
      <TextInput style={styles.input} value={orderReference} onChangeText={setOrderReference}
        placeholder="e.g. PAU-..." placeholderTextColor="#98A2B3" autoCapitalize="characters" maxLength={100} />
      <Text style={styles.label}>Describe your issue</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription}
        placeholder="What happened? What were you trying to do?" placeholderTextColor="#98A2B3"
        multiline textAlignVertical="top" maxLength={1000} />
      <Text style={styles.counter}>{description.trim().length}/1000 characters (minimum 10)</Text>
      <Pressable style={[styles.button, (submitting || !hydrated) && styles.disabled]}
        disabled={submitting || !hydrated} onPress={handleSubmit}>
        {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Save Support Request</Text>}
      </Pressable>
      <Pressable style={styles.historyToggle} onPress={() => setShowHistory(!showHistory)}>
        <Text style={styles.historyToggleText}>{showHistory ? 'Hide' : 'View'} My Support Requests ({tickets.length})</Text>
      </Pressable>
      {showHistory && (
        <View style={styles.history}>
          {!hydrated ? <Text style={styles.muted}>Loading requests…</Text> : tickets.length === 0 ?
            <Text style={styles.muted}>No saved requests yet.</Text> : tickets.map((ticket) => (
              <View key={ticket.id} style={styles.ticket}>
                <Text style={styles.ticketTitle}>{ticket.category} · {ticket.status}</Text>
                <Text selectable style={styles.reference}>{ticket.id}</Text>
                <Text style={styles.muted}>{new Date(ticket.createdAt).toLocaleString('en-NG')}</Text>
                {!!ticket.cafeteria && <Text style={styles.muted}>Cafeteria: {ticket.cafeteria}</Text>}
                {!!ticket.orderReference && <Text style={styles.muted}>Reference: {ticket.orderReference}</Text>}
                <Text style={styles.ticketDescription}>{ticket.description}</Text>
              </View>
            ))}
        </View>
      )}
      <Text style={styles.footer}>For urgent real-world problems, use your university's official support channels. This prototype cannot contact them.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 60 },
  back: { fontSize: 18, color: NAVY, marginBottom: 22 },
  title: { fontSize: 29, fontWeight: '800', color: NAVY },
  subtitle: { fontSize: 14, color: '#667085', lineHeight: 22, marginTop: 8, marginBottom: 18 },
  notice: { backgroundColor: '#FFF4DB', borderRadius: 14, padding: 16, marginBottom: 18 },
  noticeTitle: { fontSize: 15, fontWeight: '800', color: '#785C20' },
  noticeText: { color: '#785C20', fontSize: 13, lineHeight: 20, marginTop: 7 },
  connection: { color: '#785C20', fontSize: 12, fontWeight: '700', marginTop: 10 },
  section: { fontSize: 18, fontWeight: '800', color: NAVY, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: NAVY, marginTop: 20, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: { borderWidth: 1, borderColor: '#D0D5DD', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 11 },
  selectedChip: { backgroundColor: NAVY, borderColor: NAVY },
  chipText: { color: NAVY, fontSize: 13, fontWeight: '600' },
  selectedChipText: { color: '#FFFFFF' },
  input: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, padding: 14, color: NAVY, fontSize: 14 },
  textArea: { minHeight: 115 },
  counter: { textAlign: 'right', color: '#667085', fontSize: 11, marginTop: 7 },
  button: { backgroundColor: NAVY, borderRadius: 13, padding: 17, alignItems: 'center', marginTop: 23 },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  historyToggle: { paddingVertical: 20, alignItems: 'center' },
  historyToggleText: { color: '#1645A3', fontWeight: '800', fontSize: 14 },
  history: { marginTop: 5 },
  muted: { color: '#667085', fontSize: 12, marginTop: 6 },
  ticket: { borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 13, padding: 16, marginBottom: 12 },
  ticketTitle: { fontWeight: '800', color: NAVY, fontSize: 15 },
  reference: { color: '#1645A3', fontSize: 12, marginTop: 8 },
  ticketDescription: { color: '#344054', fontSize: 14, lineHeight: 21, marginTop: 10 },
  footer: { textAlign: 'center', color: '#667085', fontSize: 12, lineHeight: 19, marginTop: 20 },
});
