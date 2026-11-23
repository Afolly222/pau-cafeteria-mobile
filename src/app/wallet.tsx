
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useWallet } from '../providers/WalletProvider';

const NAVY = '#172B4D';

type Mode = 'fund' | 'withdraw' | null;

function money(value: number) {
  return `₦${value.toLocaleString('en-NG')}`;
}

function transactionTitle(
  type: 'funding' | 'withdrawal' | 'purchase' | 'refund'
) {
  switch (type) {
    case 'funding':
      return 'Wallet Funding';
    case 'withdrawal':
      return 'Withdrawal Request';
    case 'purchase':
      return 'Cafeteria Payment';
    case 'refund':
      return 'Wallet Refund';
  }
}

export default function WalletScreen() {
  const {
    balance,
    pendingBalance,
    transactions,
    hydrated,
    addMoney,
    requestWithdrawal,
  } = useWallet();

  const [mode, setMode] = useState<Mode>(null);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  function resetForm() {
    setMode(null);
    setAmount('');
    setBankName('');
    setAccountNumber('');
  }

  function submit() {
    if (!hydrated || !mode) return;

    const numericAmount = Number(amount.trim());

    if (
      !Number.isSafeInteger(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert(
        'Invalid Amount',
        'Enter a valid amount in whole naira.'
      );
      return;
    }

    if (mode === 'fund') {
      Alert.alert(
        'Confirm Demo Funding',
        `Add ${money(numericAmount)} to your prototype wallet? No real money will be charged.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Money',
            onPress: () => {
              const result = addMoney(numericAmount);

              if (!result.success) {
                Alert.alert(
                  'Unable to Add Money',
                  result.message
                );
                return;
              }

              resetForm();
              Alert.alert(
                'Wallet Funded',
                `${money(numericAmount)} has been added to your demo wallet.`
              );
            },
          },
        ]
      );
      return;
    }

    if (!bankName.trim()) {
      Alert.alert('Bank Required', 'Enter your bank name.');
      return;
    }

    if (!/^\d{10}$/.test(accountNumber.trim())) {
      Alert.alert(
        'Invalid Account',
        'Enter a valid 10-digit account number.'
      );
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Reserve ${money(numericAmount)} for a demo withdrawal? No bank transfer will be made.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            const result = requestWithdrawal(
              numericAmount,
              bankName,
              accountNumber
            );

            if (!result.success) {
              Alert.alert(
                'Request Failed',
                result.message
              );
              return;
            }

            resetForm();
            Alert.alert(
              'Request Submitted',
              'Your demo withdrawal is pending. The amount has been reserved from your wallet balance.'
            );
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.heading}>My Wallet</Text>
      <Text style={styles.subtitle}>
        Manage your cafeteria wallet and transactions.
      </Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>
          Available Balance
        </Text>
        <Text style={styles.balanceValue}>
          {hydrated ? money(balance) : 'Loading...'}
        </Text>

        {pendingBalance > 0 && (
          <Text style={styles.pendingText}>
            Pending deposits: {money(pendingBalance)}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            resetForm();
            setMode('fund');
          }}
        >
          <Text style={styles.actionText}>+ Add Money</Text>
        </Pressable>

        <Pressable
          style={styles.outlineButton}
          onPress={() => {
            resetForm();
            setMode('withdraw');
          }}
        >
          <Text style={styles.outlineText}>Withdraw</Text>
        </Pressable>
      </View>

      {mode && (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {mode === 'fund'
              ? 'Add Money'
              : 'Withdraw to Bank'}
          </Text>

          <Text style={styles.fieldLabel}>
            Amount (₦)
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Enter amount"
            placeholderTextColor="#98A2B3"
            value={amount}
            onChangeText={setAmount}
          />

          {mode === 'withdraw' && (
            <>
              <Text style={styles.fieldLabel}>
                Bank Name
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bank name"
                placeholderTextColor="#98A2B3"
                value={bankName}
                onChangeText={setBankName}
              />

              <Text style={styles.fieldLabel}>
                Account Number
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                placeholder="10-digit account number"
                placeholderTextColor="#98A2B3"
                maxLength={10}
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </>
          )}

          <Pressable
            style={styles.primaryButton}
            onPress={submit}
          >
            <Text style={styles.primaryText}>
              {mode === 'fund'
                ? 'Confirm Funding'
                : 'Request Withdrawal'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={resetForm}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Transaction History
      </Text>

      {!hydrated ? (
        <Text style={styles.empty}>
          Loading transactions...
        </Text>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>
            No transactions yet.
          </Text>
        </View>
      ) : (
        transactions.map((transaction) => {
          const positive =
            transaction.type === 'funding' ||
            transaction.type === 'refund';

          return (
            <View
              key={transaction.id}
              style={styles.transactionCard}
            >
              <View style={styles.transactionHeader}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>
                    {transactionTitle(transaction.type)}
                  </Text>

                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>

                  <Text style={styles.date}>
                    {new Date(
                      transaction.createdAt
                    ).toLocaleString()}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.transactionAmount,
                    positive
                      ? styles.positiveAmount
                      : styles.negativeAmount,
                  ]}
                >
                  {positive ? '+' : '−'}
                  {money(transaction.amount)}
                </Text>
              </View>

              <View style={styles.transactionFooter}>
                <Text
                  style={[
                    styles.status,
                    transaction.status === 'completed'
                      ? styles.completedStatus
                      : transaction.status === 'failed'
                        ? styles.failedStatus
                        : styles.pendingStatus,
                  ]}
                >
                  {transaction.status === 'completed'
                    ? 'Completed'
                    : transaction.status === 'failed'
                      ? 'Failed'
                      : 'Pending'}
                </Text>

                <Text style={styles.reference}>
                  {transaction.id}
                </Text>
              </View>
            </View>
          );
        })
      )}

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          This is an HCI prototype. Wallet funding,
          purchases, withdrawals and refunds are
          simulated. No real bank transactions occur.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 55,
  },
  back: {
    fontSize: 18,
    color: NAVY,
    marginBottom: 25,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: NAVY,
  },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 25,
  },
  balanceCard: {
    backgroundColor: NAVY,
    borderRadius: 18,
    padding: 24,
    marginBottom: 18,
  },
  balanceLabel: {
    color: '#DCE5F2',
    fontSize: 14,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 12,
  },
  pendingText: {
    color: '#FDE7A8',
    fontSize: 12,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionButton: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: NAVY,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  outlineText: {
    color: NAVY,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 18,
  },
  formCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 15,
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 9,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 11,
    padding: 14,
    color: NAVY,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: NAVY,
    borderRadius: 12,
    padding: 17,
    alignItems: 'center',
    marginTop: 22,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: NAVY,
    fontWeight: '700',
  },
  transactionCard: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  transactionDescription: {
    fontSize: 13,
    color: '#667085',
    marginTop: 5,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  positiveAmount: {
    color: '#16804A',
  },
  negativeAmount: {
    color: NAVY,
  },
  date: {
    fontSize: 12,
    color: '#98A2B3',
    marginTop: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  completedStatus: {
    color: '#16804A',
  },
  pendingStatus: {
    color: '#946200',
  },
  failedStatus: {
    color: '#B42318',
  },
  reference: {
    color: '#98A2B3',
    fontSize: 10,
    flexShrink: 1,
    textAlign: 'right',
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 14,
    padding: 22,
  },
  empty: {
    color: '#667085',
    textAlign: 'center',
  },
  notice: {
    backgroundColor: '#F2F5FA',
    borderRadius: 12,
    padding: 15,
    marginTop: 24,
  },
  noticeText: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
  },
});
