import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Calendar, Clock, MapPin, CircleAlert as AlertCircle, Mail } from 'lucide-react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useOutlookAuth } from '@/hooks/useOutlookAuth';
import Card from '@/components/ui/Card';

interface EmailDataItem {
  id: string;
  subject: string;
  sender: string;
  received_at: string;
  extracted_type: 'opportunity' | 'event' | 'time_sensitive' | 'general';
  extracted_data: {
    dates?: string[];
    times?: string[];
    locations?: string[];
    deadlines?: string[];
    description?: string;
  };
  keywords_matched: string[];
  confidence_score: number;
}

interface EmailDataListProps {
  type?: 'opportunity' | 'event' | 'time_sensitive';
  onItemPress?: (item: EmailDataItem) => void;
}

export default function EmailDataList({ type, onItemPress }: EmailDataListProps) {
  const { getExtractedEmails, isProcessingEmails } = useOutlookAuth();
  const [emails, setEmails] = useState<EmailDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEmails = async () => {
    try {
      const data = await getExtractedEmails(type);
      setEmails(data);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmails();
    setRefreshing(false);
  };

  useEffect(() => {
    loadEmails();
  }, [type]);

  const getTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'opportunity':
        return <AlertCircle size={16} color={COLORS.warning} />;
      case 'event':
        return <Calendar size={16} color={COLORS.pastelBlue} />;
      case 'time_sensitive':
        return <Clock size={16} color={COLORS.error} />;
      default:
        return <Mail size={16} color={COLORS.textMedium} />;
    }
  };

  const getTypeColor = (itemType: string) => {
    switch (itemType) {
      case 'opportunity':
        return COLORS.warning;
      case 'event':
        return COLORS.pastelBlue;
      case 'time_sensitive':
        return COLORS.error;
      default:
        return COLORS.textMedium;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderEmailItem = ({ item }: { item: EmailDataItem }) => (
    <TouchableOpacity
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.emailCard} elevation="low">
        <View style={styles.emailHeader}>
          <View style={styles.typeContainer}>
            {getTypeIcon(item.extracted_type)}
            <Text style={[styles.typeText, { color: getTypeColor(item.extracted_type) }]}>
              {item.extracted_type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {formatDate(item.received_at)}
          </Text>
        </View>

        <Text style={styles.subjectText} numberOfLines={2}>
          {item.subject}
        </Text>

        <Text style={styles.senderText}>
          From: {item.sender}
        </Text>

        {item.extracted_data.description && (
          <Text style={styles.descriptionText} numberOfLines={3}>
            {item.extracted_data.description}
          </Text>
        )}

        <View style={styles.extractedDataContainer}>
          {item.extracted_data.dates && item.extracted_data.dates.length > 0 && (
            <View style={styles.dataItem}>
              <Calendar size={14} color={COLORS.textMedium} />
              <Text style={styles.dataText}>
                {item.extracted_data.dates.slice(0, 2).join(', ')}
              </Text>
            </View>
          )}

          {item.extracted_data.times && item.extracted_data.times.length > 0 && (
            <View style={styles.dataItem}>
              <Clock size={14} color={COLORS.textMedium} />
              <Text style={styles.dataText}>
                {item.extracted_data.times.slice(0, 2).join(', ')}
              </Text>
            </View>
          )}

          {item.extracted_data.locations && item.extracted_data.locations.length > 0 && (
            <View style={styles.dataItem}>
              <MapPin size={14} color={COLORS.textMedium} />
              <Text style={styles.dataText}>
                {item.extracted_data.locations.slice(0, 1).join(', ')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.keywordsContainer}>
            {item.keywords_matched.slice(0, 3).map((keyword, index) => (
              <View key={index} style={styles.keywordTag}>
                <Text style={styles.keywordText}>{keyword}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>
              {Math.round(item.confidence_score * 100)}% match
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading emails...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={emails}
      renderItem={renderEmailItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[COLORS.pastelBlue]}
          tintColor={COLORS.pastelBlue}
        />
      }
      ListEmptyComponent={() => (
        <View style={styles.centerContainer}>
          <Mail size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>
            {type ? `No ${type.replace('_', ' ')} emails found` : 'No processed emails found'}
          </Text>
          <Text style={styles.emptySubtext}>
            Connect your Outlook account to start processing emails
          </Text>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: SIZES.spacing_16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing_32,
  },
  loadingText: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: SIZES.lg,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginTop: SIZES.spacing_16,
  },
  emptySubtext: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.spacing_8,
  },
  emailCard: {
    marginBottom: SIZES.spacing_12,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing_8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    ...FONTS.medium,
    fontSize: SIZES.xs,
    marginLeft: SIZES.spacing_4,
  },
  dateText: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.textLight,
  },
  subjectText: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_4,
  },
  senderText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    marginBottom: SIZES.spacing_8,
  },
  descriptionText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
    marginBottom: SIZES.spacing_12,
  },
  extractedDataContainer: {
    marginBottom: SIZES.spacing_12,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing_4,
  },
  dataText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    marginLeft: SIZES.spacing_8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
  },
  keywordTag: {
    backgroundColor: COLORS.pastelGreen,
    paddingHorizontal: SIZES.spacing_8,
    paddingVertical: SIZES.spacing_2,
    borderRadius: SIZES.radius_8,
    marginRight: SIZES.spacing_4,
    marginBottom: SIZES.spacing_4,
  },
  keywordText: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.textDark,
  },
  confidenceContainer: {
    marginLeft: SIZES.spacing_8,
  },
  confidenceText: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.textLight,
  },
});