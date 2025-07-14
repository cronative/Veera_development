import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCw, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock } from 'lucide-react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useEmailSync } from '@/hooks/useEmailSync';
import Card from '@/components/ui/Card';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence
} from 'react-native-reanimated';
import { useEffect } from 'react';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function EmailSyncStatus() {
  const { 
    syncStatus, 
    lastSyncResult, 
    manualRefresh, 
    isProcessing, 
    lastSync, 
    error,
    totalProcessed 
  } = useEmailSync();

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isProcessing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [isProcessing]);

  const handleManualRefresh = async () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    await manualRefresh();
  };

  const animatedRefreshStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
    };
  });

  const getStatusIcon = () => {
    if (isProcessing) {
      return <ActivityIndicator size="small" color={COLORS.pastelBlue} />;
    }
    
    if (error) {
      return <AlertCircle size={16} color={COLORS.error} />;
    }
    
    if (lastSync) {
      return <CheckCircle size={16} color={COLORS.success} />;
    }
    
    return <Clock size={16} color={COLORS.textMedium} />;
  };

  const getStatusText = () => {
    if (isProcessing) {
      return 'Syncing emails...';
    }
    
    if (error) {
      return `Sync failed: ${error}`;
    }
    
    if (lastSync) {
      const timeAgo = Math.floor((Date.now() - lastSync.getTime()) / 1000 / 60);
      if (timeAgo < 1) {
        return 'Just synced';
      } else if (timeAgo < 60) {
        return `Synced ${timeAgo}m ago`;
      } else {
        const hoursAgo = Math.floor(timeAgo / 60);
        return `Synced ${hoursAgo}h ago`;
      }
    }
    
    return 'Not synced yet';
  };

  const getStatusColor = () => {
    if (isProcessing) return COLORS.pastelBlue;
    if (error) return COLORS.error;
    if (lastSync) return COLORS.success;
    return COLORS.textMedium;
  };

  return (
    <Card style={styles.container} elevation="low">
      <View style={styles.header}>
        <View style={styles.statusInfo}>
          {getStatusIcon()}
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            {lastSyncResult && (
              <Text style={styles.statusDetails}>
                {lastSyncResult.success 
                  ? `${lastSyncResult.newEmails} new emails processed`
                  : 'Sync failed'
                }
              </Text>
            )}
          </View>
        </View>

        <AnimatedTouchable
          style={[styles.refreshButton, animatedRefreshStyle]}
          onPress={handleManualRefresh}
          disabled={isProcessing}
        >
          <RefreshCw 
            size={20} 
            color={isProcessing ? COLORS.textLight : COLORS.pastelBlue} 
          />
        </AnimatedTouchable>
      </View>

      {totalProcessed > 0 && (
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            Total emails processed: {totalProcessed}
          </Text>
        </View>
      )}

      {lastSyncResult?.details && (
        <View style={styles.details}>
          <Text style={styles.detailsTitle}>Last Sync Details:</Text>
          <Text style={styles.detailsText}>
            • Fetched: {lastSyncResult.details.emailsFetched} emails
          </Text>
          <Text style={styles.detailsText}>
            • Stored: {lastSyncResult.details.emailsStored} emails
          </Text>
          <Text style={styles.detailsText}>
            • Processing time: {lastSyncResult.details.processingTime}ms
          </Text>
          {lastSyncResult.details.tokenRefreshed && (
            <Text style={styles.detailsText}>
              • Token refreshed successfully
            </Text>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.spacing_16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: SIZES.spacing_12,
    flex: 1,
  },
  statusTitle: {
    ...FONTS.medium,
    fontSize: SIZES.sm,
  },
  statusDetails: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.textMedium,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  stats: {
    marginTop: SIZES.spacing_12,
    paddingTop: SIZES.spacing_12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  statsText: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.textMedium,
  },
  details: {
    marginTop: SIZES.spacing_12,
    paddingTop: SIZES.spacing_12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  detailsTitle: {
    ...FONTS.medium,
    fontSize: SIZES.xs,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_4,
  },
  detailsText: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.textMedium,
    marginBottom: 2,
  },
});