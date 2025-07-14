import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { supabase } from '@/utils/supabase';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { User, Mail, Lock, CircleHelp as HelpCircle, LogOut, Pencil, Check, Camera, Eye, EyeOff } from 'lucide-react-native';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  created_at: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfileScreen() {
  const { session } = useSessionContext();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // User profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  
  // Password change state
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Form validation errors
  const [errors, setErrors] = useState<{
    full_name?: string;
    username?: string;
    email?: string;
    phone?: string;
    bio?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      // Get user metadata from auth
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw authError;
      }

      // Create profile object from auth data and metadata
      const userProfile: UserProfile = {
        id: authUser.user.id,
        email: authUser.user.email || '',
        full_name: authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || '',
        username: authUser.user.user_metadata?.username || '',
        avatar_url: authUser.user.user_metadata?.avatar_url,
        phone: authUser.user.user_metadata?.phone || authUser.user.phone || '',
        bio: authUser.user.user_metadata?.bio || '',
        created_at: authUser.user.created_at
      };

      setProfile(userProfile);
      setEditedProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrors({ general: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const validateProfile = (): boolean => {
    const newErrors: typeof errors = {};

    if (!editedProfile.full_name?.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (editedProfile.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    if (!editedProfile.username?.trim()) {
      newErrors.username = 'Username is required';
    } else if (editedProfile.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(editedProfile.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!editedProfile.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (editedProfile.phone && !/^\+?[\d\s\-\(\)]+$/.test(editedProfile.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (editedProfile.bio && editedProfile.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (): boolean => {
    const newErrors: typeof errors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        email: editedProfile.email,
        data: {
          full_name: editedProfile.full_name,
          username: editedProfile.username,
          phone: editedProfile.phone,
          bio: editedProfile.bio,
          avatar_url: editedProfile.avatar_url
        }
      });

      if (error) {
        throw error;
      }

      // Update local state
      setProfile(editedProfile as UserProfile);
      setIsEditing(false);

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.message.includes('email')) {
        setErrors({ email: 'This email is already in use' });
      } else {
        setErrors({ general: error.message || 'Failed to update profile' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: passwordData.currentPassword
      });

      if (verifyError) {
        setErrors({ currentPassword: 'Current password is incorrect' });
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      // Reset form and close modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);

      Alert.alert('Success', 'Password changed successfully!');
    } catch (error: any) {
      console.error('Error changing password:', error);
      setErrors({ general: error.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        }
      ]
    );
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Reset edited profile to original
      setEditedProfile(profile || {});
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.pastelGreenDark} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button title="Retry" onPress={fetchUserProfile} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ 
                uri: profile.avatar_url || 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=200' 
              }}
              style={styles.profileImage}
            />
            {isEditing && (
              <TouchableOpacity style={styles.editImageButton}>
                <Camera size={18} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.profileName}>{profile.full_name || 'No name set'}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <Text style={styles.memberSince}>
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </Text>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={isEditing ? handleSaveProfile : toggleEdit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.pastelGreenDark} />
            ) : isEditing ? (
              <Check size={20} color={COLORS.pastelGreenDark} />
            ) : (
              <Pencil size={20} color={COLORS.pastelGreenDark} />
            )}
            <Text style={styles.editButtonText}>
              {saving ? 'Saving...' : isEditing ? 'Save Profile' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={toggleEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {errors.general && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{errors.general}</Text>
          </Card>
        )}
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Input
            label="Full Name"
            value={isEditing ? editedProfile.full_name || '' : profile.full_name}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, full_name: text }))}
            editable={isEditing}
            leftIcon={<User size={20} color={COLORS.textMedium} />}
            error={errors.full_name}
          />
          
          <Input
            label="Username"
            value={isEditing ? editedProfile.username || '' : profile.username}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, username: text }))}
            editable={isEditing}
            leftIcon={<User size={20} color={COLORS.textMedium} />}
            error={errors.username}
            autoCapitalize="none"
          />
          
          <Input
            label="Email Address"
            value={isEditing ? editedProfile.email || '' : profile.email}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, email: text }))}
            editable={isEditing}
            leftIcon={<Mail size={20} color={COLORS.textMedium} />}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          
          <Input
            label="Phone Number (Optional)"
            value={isEditing ? editedProfile.phone || '' : profile.phone || ''}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, phone: text }))}
            editable={isEditing}
            keyboardType="phone-pad"
            error={errors.phone}
            placeholder="Enter your phone number"
          />

          <Input
            label="Bio (Optional)"
            value={isEditing ? editedProfile.bio || '' : profile.bio || ''}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, bio: text }))}
            editable={isEditing}
            multiline
            numberOfLines={3}
            error={errors.bio}
            placeholder="Tell us about yourself..."
          />
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity 
            style={styles.securityItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <Lock size={20} color={COLORS.textDark} />
            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>Change Password</Text>
              <Text style={styles.securitySubtitle}>
                Update your account password
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.supportItem}>
            <HelpCircle size={20} color={COLORS.textDark} />
            <Text style={styles.supportItemText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <LogOut size={20} color={COLORS.error} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </Card>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <Input
              label="Current Password"
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
              leftIcon={<Lock size={20} color={COLORS.textMedium} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? (
                    <EyeOff size={20} color={COLORS.textMedium} />
                  ) : (
                    <Eye size={20} color={COLORS.textMedium} />
                  )}
                </TouchableOpacity>
              }
              secureTextEntry={!showCurrentPassword}
              error={errors.currentPassword}
            />

            <Input
              label="New Password"
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
              leftIcon={<Lock size={20} color={COLORS.textMedium} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? (
                    <EyeOff size={20} color={COLORS.textMedium} />
                  ) : (
                    <Eye size={20} color={COLORS.textMedium} />
                  )}
                </TouchableOpacity>
              }
              secureTextEntry={!showNewPassword}
              error={errors.newPassword}
            />

            <Input
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
              leftIcon={<Lock size={20} color={COLORS.textMedium} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={COLORS.textMedium} />
                  ) : (
                    <Eye size={20} color={COLORS.textMedium} />
                  )}
                </TouchableOpacity>
              }
              secureTextEntry={!showConfirmPassword}
              error={errors.confirmPassword}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setErrors({});
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={saving ? "Changing..." : "Change Password"}
                onPress={handleChangePassword}
                disabled={saving}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    marginTop: SIZES.spacing_16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.spacing_20,
  },
  errorCard: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  errorText: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
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
    padding: SIZES.spacing_16,
    paddingBottom: SIZES.spacing_32,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SIZES.spacing_24,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: SIZES.spacing_16,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  editImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.pastelGreenDark,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profileName: {
    ...FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_4,
  },
  profileEmail: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    marginBottom: SIZES.spacing_4,
  },
  memberSince: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SIZES.spacing_16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing_8,
    paddingHorizontal: SIZES.spacing_16,
    backgroundColor: COLORS.pastelGreen,
    borderRadius: SIZES.radius_20,
    marginBottom: SIZES.spacing_8,
  },
  editButtonText: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.pastelGreenDark,
    marginLeft: SIZES.spacing_8,
  },
  cancelButton: {
    paddingVertical: SIZES.spacing_8,
    paddingHorizontal: SIZES.spacing_16,
  },
  cancelButtonText: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
  },
  section: {
    marginBottom: SIZES.spacing_16,
  },
  sectionTitle: {
    ...FONTS.medium,
    fontSize: SIZES.lg,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing_12,
  },
  securityContent: {
    flex: 1,
    marginLeft: SIZES.spacing_12,
  },
  securityTitle: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.textDark,
  },
  securitySubtitle: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing_12,
  },
  supportItemText: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.textDark,
    marginLeft: SIZES.spacing_12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing_12,
    marginTop: SIZES.spacing_8,
  },
  logoutButtonText: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.error,
    marginLeft: SIZES.spacing_12,
  },
  versionText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.spacing_8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing_20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius_12,
    padding: SIZES.spacing_24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...FONTS.bold,
    fontSize: SIZES.lg,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SIZES.spacing_24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.spacing_12,
    marginTop: SIZES.spacing_16,
  },
  modalButton: {
    flex: 1,
  },
});