import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Mail, Calendar, CircleAlert as AlertCircle, Clock } from 'lucide-react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import OutlookAuthButton from '@/components/auth/OutlookAuthButton';
import EmailDataList from '@/components/email/EmailDataList';
import EmailSyncStatus from '@/components/email/EmailSyncStatus';
import Card from '@/components/ui/Card';
import { supabase } from '@/utils/supabase';
import { useSession } from '@supabase/auth-helpers-react';
import { useOutlookAuth } from '@/hooks/useOutlookAuth';

type EmailType = 'all' | 'opportunity' | 'event' | 'time_sensitive';

export default function EmailsScreen() {
  const [activeTab, setActiveTab] = useState<EmailType>('all');
  const [isConnected, setIsConnected] = useState(false);
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false);
  
  const session = useSession();
  const { authenticate, isAuthenticating, error } = useOutlookAuth();

  const tabs = [
    { key: 'all' as EmailType, label: 'All', icon: Mail },
    { key: 'opportunity' as EmailType, label: 'Opportunities', icon: AlertCircle },
    { key: 'event' as EmailType, label: 'Events', icon: Calendar },
    { key: 'time_sensitive' as EmailType, label: 'Urgent', icon: Clock },
  ];

  const handleAuthSuccess = () => {
    setIsConnected(true);
  };

  const handleEmailItemPress = (item: any) => {
    console.log('Email item pressed:', item);
  };

  // 🔁 Check if user already connected Outlook
  useEffect(() => {
    const checkOutlookConnection = async () => {
      if (!session || !session.user?.id) return;

      const { data, error } = await supabase
        .from('user_email_accounts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('provider', 'microsoft')
        .maybeSingle();

      if (data && !error) {
        setIsConnected(true);
      } else if (!hasAttemptedAutoConnect && !isAuthenticating) {
        // ✅ First-time login: auto-trigger Outlook auth
        setHasAttemptedAutoConnect(true);
        const result = await authenticate();
        if (result.success) {
          setIsConnected(true);
        } else if (result.error && result.error !== 'Authentication was cancelled') {
          Alert.alert('Outlook Auth Failed', result.error);
        }
      }
    };

    checkOutlookConnection();
  }, [session?.user?.id, hasAttemptedAutoConnect, isAuthenticating]);

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Email Intelligence</Text>
          <Text style={styles.headerSubtitle}>
            Connect your Outlook to automatically extract important information from your emails
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.welcomeCard}>
            <View style={styles.welcomeIcon}>
              <Mail size={48} color={COLORS.pastelBlue} />
            </View>

            <Text style={styles.welcomeTitle}>Smart Email Processing</Text>
            <Text style={styles.welcomeDescription}>
              Our AI automatically scans your emails for:
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <AlertCircle size={20} color={COLORS.warning} />
                <Text style={styles.featureText}>Job opportunities and applications</Text>
              </View>

              <View style={styles.featureItem}>
                <Calendar size={20} color={COLORS.pastelBlue} />
                <Text style={styles.featureText}>Events and meetings</Text>
              </View>

              <View style={styles.featureItem}>
                <Clock size={20} color={COLORS.error} />
                <Text style={styles.featureText}>Time-sensitive deadlines</Text>
              </View>
            </View>

            <Text style={styles.privacyNote}>
              🔒 Your email data is processed securely and never shared
            </Text>
          </Card>

          <OutlookAuthButton
            onSuccess={handleAuthSuccess}
            onError={(error) => console.error('Auth error:', error)}
            style={styles.authButton}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Email Intelligence</Text>
        <Text style={styles.headerSubtitle}>
          AI-extracted insights from your emails
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Email Sync Status */}
        <View style={styles.syncStatusContainer}>
          <EmailSyncStatus />
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.activeTab]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Icon
                    size={18}
                    color={isActive ? COLORS.white : COLORS.textMedium}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      isActive && styles.activeTabText,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.listContainer}>
          <EmailDataList
            type={activeTab === 'all' ? undefined : activeTab}
            onItemPress={handleEmailItemPress}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.pastelYellow,
    paddingTop: SIZES.spacing_48,
    paddingBottom: SIZES.spacing_16,
    paddingHorizontal: SIZES.spacing_20,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xxl,
    color: COLORS.textDark,
  },
  headerSubtitle: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  syncStatusContainer: {
    padding: SIZES.spacing_16,
  },
  welcomeCard: {
    alignItems: 'center',
    marginBottom: SIZES.spacing_24,
    margin: SIZES.spacing_16,
  },
  welcomeIcon: {
    marginBottom: SIZES.spacing_16,
  },
  welcomeTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_8,
  },
  welcomeDescription: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SIZES.spacing_16,
  },
  featuresList: {
    width: '100%',
    marginBottom: SIZES.spacing_16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing_12,
  },
  featureText: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textDark,
    marginLeft: SIZES.spacing_12,
    flex: 1,
  },
  privacyNote: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  authButton: {
    marginTop: SIZES.spacing_16,
    marginHorizontal: SIZES.spacing_16,
  },
  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabsContent: {
    paddingHorizontal: SIZES.spacing_16,
    paddingVertical: SIZES.spacing_8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing_16,
    paddingVertical: SIZES.spacing_8,
    marginRight: SIZES.spacing_8,
    borderRadius: SIZES.radius_20,
    backgroundColor: COLORS.background,
  },
  activeTab: {
    backgroundColor: COLORS.pastelBlue,
  },
  tabText: {
    ...FONTS.medium,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    marginLeft: SIZES.spacing_8,
  },
  activeTabText: {
    color: COLORS.white,
  },
  listContainer: {
    flex: 1,
  },
});