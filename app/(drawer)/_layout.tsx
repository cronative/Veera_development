import { Drawer } from 'expo-router/drawer';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { COLORS } from '@/constants/theme';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { StyleSheet, Text, View, Image, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';
import { MessageSquare, SquareCheck as CheckSquare, User, LogOut, Mail } from 'lucide-react-native';
import { supabase } from '@/utils/supabase';

function CustomDrawerContent(props: any) {
  const { state, navigation, descriptors } = props;
  const { session } = useSessionContext();
  const router = useRouter();
  const activeRouteIndex = state.index;
  
  console.log('[Drawer] CustomDrawerContent rendering, session:', !!session);
  
  const animatedValues = state.routes.map((_, i) => useSharedValue(i === activeRouteIndex ? 1 : 0));
  
  const onDrawerItemPress = useCallback((route: any, index: number) => {
    const isFocused = state.index === index;
    
    console.log('[Navigation] Drawer item pressed:', { route: route.name, index, isFocused });
    
    if (!isFocused) {
      navigation.navigate(route.name);
    }
    
    // Animate highlight
    animatedValues.forEach((value, i) => {
      value.value = withTiming(i === index ? 1 : 0, { duration: 200 });
    });
  }, [state, navigation, animatedValues]);

  const handleSignOut = async () => {
    console.log('[User Auth] Sign out initiated');
    try {
      await supabase.auth.signOut();
      console.log('[User Auth] Sign out successful, redirecting to login');
      router.replace('/login');
    } catch (error) {
      console.error('[User Auth] Error signing out:', error);
    }
  };

  const userEmail = session?.user?.email || 'user@example.com';
  const userName = session?.user?.user_metadata?.full_name || 'Student';

  console.log('[User Auth] Current user info:', { userEmail, userName });

  return (
    <DrawerContentScrollView 
      {...props}
      contentContainerStyle={styles.drawerContent}
    >
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=200' }} 
            style={styles.profileImage} 
          />
        </View>
        <Text style={styles.profileName}>{userName}</Text>
        <Text style={styles.profileEmail}>{userEmail}</Text>
      </View>
      
      <View style={styles.drawerItemsContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.drawerLabel || options.title || route.name;
          
          // Get icon based on route name
          let icon: JSX.Element;
          switch (route.name) {
            case 'index':
              icon = <MessageSquare size={22} color={activeRouteIndex === index ? COLORS.pastelGreenDark : COLORS.textMedium} />;
              break;
            case 'tasks':
              icon = <CheckSquare size={22} color={activeRouteIndex === index ? COLORS.pastelGreenDark : COLORS.textMedium} />;
              break;
            case 'emails':
              icon = <Mail size={22} color={activeRouteIndex === index ? COLORS.pastelGreenDark : COLORS.textMedium} />;
              break;
            case 'profile':
              icon = <User size={22} color={activeRouteIndex === index ? COLORS.pastelGreenDark : COLORS.textMedium} />;
              break;
            default:
              icon = <MessageSquare size={22} color={activeRouteIndex === index ? COLORS.pastelGreenDark : COLORS.textMedium} />;
          }
          
          const animatedStyle = useAnimatedStyle(() => {
            return {
              backgroundColor: COLORS.pastelYellow,
              opacity: withTiming(animatedValues[index].value, { duration: 150 }),
              transform: [
                { 
                  scale: withTiming(animatedValues[index].value * 0.03 + 1, { duration: 150 })
                }
              ]
            };
          });
          
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => onDrawerItemPress(route, index)}
              style={styles.drawerItem}
            >
              <Animated.View style={[styles.highlightBackground, animatedStyle]} />
              <View style={styles.drawerItemContent}>
                <View style={styles.iconContainer}>{icon}</View>
                <Text style={[
                  styles.drawerItemLabel,
                  activeRouteIndex === index ? styles.activeLabel : null
                ]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={COLORS.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>Vera</Text>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  console.log('[Navigation] DrawerLayout component initializing');
  
  const { session, isLoading } = useSessionContext();
  const router = useRouter();

  console.log('[Session State] DrawerLayout session check:', { 
    sessionExists: !!session, 
    sessionValue: session,
    isLoading 
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('[User Auth] DrawerLayout useEffect - session change detected:', { session, isLoading });
    
    if (!isLoading && !session) {
      console.log('[Navigation] Redirecting to login - no session found');
      router.replace('/login');
    }
  }, [session, isLoading, router]);

  // Show loading while session is being determined
  if (isLoading) {
    console.log('[Loading] Activity indicator visible: DrawerLayout - session loading');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.pastelGreenDark} />
      </View>
    );
  }

  // Don't render drawer if not authenticated
  if (!session) {
    console.log('[Loading] Activity indicator hidden: DrawerLayout - no session, not rendering');
    return null;
  }

  console.log('[Navigation] Drawer navigation initializing with session');

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.pastelYellow,
        },
        headerTintColor: COLORS.textDark,
        headerTitleStyle: {
          fontFamily: Platform.select({
            ios: '-apple-system',
            android: 'Roboto',
            web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            default: 'Arial'
          }),
          fontWeight: '500',
        },
        drawerStyle: {
          backgroundColor: COLORS.white,
          width: 280,
        },
        drawerActiveBackgroundColor: COLORS.pastelYellow,
        drawerInactiveBackgroundColor: 'transparent',
        drawerActiveTintColor: COLORS.textDark,
        drawerInactiveTintColor: COLORS.textMedium,
        drawerLabelStyle: {
          fontFamily: Platform.select({
            ios: '-apple-system',
            android: 'Roboto',
            web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            default: 'Arial'
          }),
          marginLeft: -20,
        },
        sceneContainerStyle: {
          backgroundColor: COLORS.background
        }
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Chat",
          title: "Chat",
        }}
      />
      <Drawer.Screen
        name="tasks"
        options={{
          drawerLabel: "Tasks",
          title: "Tasks",
        }}
      />
      <Drawer.Screen
        name="emails"
        options={{
          drawerLabel: "Emails",
          title: "Emails",
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  drawerContent: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textMedium,
  },
  drawerItemsContainer: {
    marginTop: 10,
    flex: 1,
  },
  drawerItem: {
    marginBottom: 15,
    overflow: 'hidden',
    borderRadius: 12,
  },
  highlightBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  drawerItemLabel: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'Arial'
    }),
    color: COLORS.textMedium,
  },
  activeLabel: {
    color: COLORS.textDark,
    fontWeight: '500',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 16,
    color: COLORS.error,
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'Arial'
    }),
    fontWeight: '500',
    marginLeft: 12,
  },
  footerText: {
    fontSize: 16,
    color: COLORS.textMedium,
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'Arial'
    }),
    fontWeight: '500',
  },
});