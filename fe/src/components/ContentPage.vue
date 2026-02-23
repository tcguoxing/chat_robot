<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getOtherUsersApi, getContentApi, getRecentVisitorsApi, uploadContentApi } from '../api'
import type { UserInfo, ContentItem, VisitorInfo, UploadRequest } from '../api'
import WeatherInfo from './WeatherInfo.vue'

const router = useRouter()

// Mock current user data
const currentUser = reactive({
  id: 1,
  username: 'currentUser',
  avatar: 'https://picsum.photos/id/1000/200/200',
  bio: 'This is my profile bio',
  followers: 1234,
  following: 567
})

// State for API data
const otherUsers = ref<UserInfo[]>([])
const contentList = ref<ContentItem[]>([])
const recentVisitors = ref<VisitorInfo[]>([])

// Loading states
const loadingUsers = ref(false)
const loadingContent = ref(false)
const loadingVisitors = ref(false)
const uploading = ref(false)

// Search functionality
const searchQuery = ref('')

// Upload modal
const showUploadModal = ref(false)
const uploadForm = reactive({
  caption: '',
  tags: '',
  file: null as File | null
})

// Fetch data on component mount
onMounted(() => {
  fetchOtherUsers()
  fetchContent()
  fetchRecentVisitors()
})

// Fetch other users
const fetchOtherUsers = async () => {
  loadingUsers.value = true
  try {
    const res = await getOtherUsersApi()
    if (res.code === 200) {
      otherUsers.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败，请稍后重试')
  } finally {
    loadingUsers.value = false
  }
}

// Fetch content
const fetchContent = async () => {
  loadingContent.value = true
  try {
    const res = await getContentApi()
    if (res.code === 200) {
      contentList.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取内容失败')
    }
  } catch (error) {
    console.error('获取内容失败:', error)
    ElMessage.error('获取内容失败，请稍后重试')
  } finally {
    loadingContent.value = false
  }
}

// Fetch recent visitors
const fetchRecentVisitors = async () => {
  loadingVisitors.value = true
  try {
    const res = await getRecentVisitorsApi()
    if (res.code === 200) {
      recentVisitors.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取访客列表失败')
    }
  } catch (error) {
    console.error('获取访客列表失败:', error)
    ElMessage.error('获取访客列表失败，请稍后重试')
  } finally {
    loadingVisitors.value = false
  }
}

// Handle search
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    ElMessage.info(`搜索: ${searchQuery.value}`)
    // Implement actual search functionality here
  }
}

// Handle follow/unfollow
const toggleFollow = (user: UserInfo) => {
  user.isFollowing = !user.isFollowing
  user.followerCount = user.isFollowing ? (user.followerCount || 0) + 1 : (user.followerCount || 0) - 1
  ElMessage.success(user.isFollowing ? '已关注' : '已取消关注')
}

// Handle like/unlike content
const toggleLike = (content: ContentItem) => {
  content.isLiked = !content.isLiked
  content.likes = content.isLiked ? content.likes + 1 : content.likes - 1
}

// Handle file selection
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const selectedFile = input.files[0]
    if (selectedFile) {
      uploadForm.file = selectedFile
    }
  } else {
    uploadForm.file = null
  }
}

// Handle upload
const handleUpload = async () => {
  if (!uploadForm.file) {
    ElMessage.error('请选择要上传的文件')
    return
  }
  
  uploading.value = true
  
  try {
    const uploadParams: UploadRequest = {
      file: uploadForm.file,
      caption: uploadForm.caption,
      tags: uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()) : []
    }
    
    const res = await uploadContentApi(uploadParams)
    if (res.code === 200) {
      ElMessage.success('上传成功')
      showUploadModal.value = false
      // Reset form
      uploadForm.caption = ''
      uploadForm.tags = ''
      uploadForm.file = null
      // Refresh content list
      fetchContent()
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    uploading.value = false
  }
}

// Handle logout
const handleLogout = () => {
  // Implement logout functionality here
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>

<template>
  <div class="content-container">
    <!-- Left Column -->
    <aside class="left-column">
      <!-- Logo -->
      <div class="logo-section">
        <h1 class="logo">CurrentUser</h1>
      </div>
      
      <!-- User Profile -->
      <div class="profile-section">
        <div class="profile-header">
          <img :src="currentUser.avatar" alt="User Avatar" class="avatar" />
          <div class="profile-info">
            <h3 class="username">{{ currentUser.username }}</h3>
            <p class="bio">{{ currentUser.bio }}</p>
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-number">{{ currentUser.followers }}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ currentUser.following }}</span>
            <span class="stat-label">Following</span>
          </div>
        </div>
        <el-button type="primary" plain size="small" class="edit-profile-btn">Edit Profile</el-button>
      </div>
      
      <!-- Search -->
      <div class="search-section">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search..." 
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button @click="handleSearch" class="search-btn">Search</button>
        </div>
      </div>
      
      <!-- Navigation -->
      <nav class="nav-section">
        <ul class="nav-list">
          <li class="nav-item active">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Home</span>
          </li>
          <li class="nav-item">
            <span class="nav-icon">🔍</span>
            <span class="nav-text">Explore</span>
          </li>
          <li class="nav-item">
            <span class="nav-icon">📷</span>
            <span class="nav-text">Reels</span>
          </li>
          <li class="nav-item">
            <span class="nav-icon">💬</span>
            <span class="nav-text">Messages</span>
          </li>
          <li class="nav-item">
            <span class="nav-icon">❤️</span>
            <span class="nav-text">Notifications</span>
          </li>
          <li class="nav-item">
            <span class="nav-icon">📝</span>
            <span class="nav-text">Create</span>
          </li>
          <li class="nav-item">
            <span class="nav-icon">👤</span>
            <span class="nav-text">Profile</span>
          </li>
          <li class="nav-item" @click="handleLogout">
            <span class="nav-icon">🚪</span>
            <span class="nav-text">Logout</span>
          </li>
        </ul>
      </nav>
    </aside>
    
    <!-- Middle Column -->
    <main class="middle-column">
      <!-- Top Section: Other Users -->
      <section role="weatherAI" >
        <h2 class="section-title">getCurrentWeather</h2>
        <weather-info/>
      </section>
      <section class="other-users-section">
        <h2 class="section-title">Other Users</h2>
        <div class="users-scroll-container">
          <div v-if="loadingUsers" class="loading-container">
            <el-skeleton :rows="1" animated />
          </div>
          <div v-else-if="otherUsers.length > 0" class="users-list">
            <div 
              v-for="user in otherUsers" 
              :key="user.id" 
              class="user-item"
            >
              <img :src="user.avatar" alt="User Avatar" class="user-avatar" />
              <div class="user-name">{{ user.username }}</div>
              <el-button 
                :type="user.isFollowing ? 'default' : 'primary'" 
                size="small" 
                class="follow-btn"
                @click="toggleFollow(user)"
              >
                {{ user.isFollowing ? 'Following' : 'Follow' }}
              </el-button>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Main Section: Content Feed -->
      <section class="content-section">
        <h2 class="section-title">Content Feed</h2>
        <div v-if="loadingContent" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else class="content-list">
          <div 
            v-for="content in contentList" 
            :key="content.id" 
            class="content-item"
          >
            <!-- Content Header -->
            <div class="content-header">
              <div class="content-user">
                <img :src="content.avatar" alt="User Avatar" class="content-user-avatar" />
                <span class="content-username">{{ content.username }}</span>
              </div>
              <span class="content-more">•••</span>
            </div>
            
            <!-- Content Image -->
            <div class="content-image-container">
              <img :src="content.imageUrl" alt="Content Image" class="content-image" />
            </div>
            
            <!-- Content Actions -->
            <div class="content-actions">
              <div class="action-buttons">
                <button 
                  class="action-btn like-btn" 
                  :class="{ liked: content.isLiked }"
                  @click="toggleLike(content)"
                >
                  {{ content.isLiked ? '❤️' : '🤍' }}
                </button>
                <button class="action-btn comment-btn">💬</button>
                <button class="action-btn share-btn">🔗</button>
              </div>
              <button class="action-btn save-btn">💾</button>
            </div>
            
            <!-- Content Stats -->
            <div class="content-stats">
              <span class="likes-count">{{ content.likes }} likes</span>
            </div>
            
            <!-- Content Description -->
            <div class="content-description">
              <span class="content-username">{{ content.username }}</span>
              <span class="content-text">{{ content.content }}</span>
            </div>
            
            <!-- Content Comments -->
            <div class="content-comments">
              <div class="comment-count">View all {{ content.comments }} comments</div>
              <div class="comment-input">
                <input type="text" placeholder="Add a comment..." class="comment-text-input" />
                <button class="comment-post-btn">Post</button>
              </div>
            </div>
            
            <!-- Content Timestamp -->
            <div class="content-timestamp">
              {{ new Date(content.createdAt).toLocaleDateString() }}
            </div>
          </div>
        </div>
      </section>
    </main>
    
    <!-- Right Column -->
    <aside class="right-column">
      <!-- Top Section: Upload -->
      <section class="upload-section">
        <h2 class="section-title">Upload</h2>
        <el-button 
          type="primary" 
          size="large" 
          class="upload-btn"
          @click="showUploadModal = true"
        >
          Upload Content
        </el-button>
      </section>
      
      <!-- Upload Modal -->
      <el-dialog
        v-model="showUploadModal"
        title="Upload Content"
        width="500px"
      >
        <el-form>
          <el-form-item label="File">
            <input 
              type="file" 
              accept="image/*,video/*" 
              @change="handleFileChange"
              class="file-input"
            />
            <div v-if="uploadForm.file" class="file-name">{{ uploadForm.file.name }}</div>
          </el-form-item>
          <el-form-item label="Caption">
            <el-input 
              v-model="uploadForm.caption" 
              type="textarea" 
              placeholder="Add a caption..."
              rows="4"
            />
          </el-form-item>
          <el-form-item label="Tags (comma-separated)">
            <el-input 
              v-model="uploadForm.tags" 
              placeholder="e.g., #nature, #beach"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showUploadModal = false">Cancel</el-button>
          <el-button 
            type="primary" 
            @click="handleUpload" 
            :loading="uploading"
          >
            Upload
          </el-button>
        </template>
      </el-dialog>
      
      <!-- Main Section: Recent Visitors -->
      <section class="visitors-section">
        <h2 class="section-title">Recent Visitors</h2>
        <div v-if="loadingVisitors" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else class="visitors-list">
          <div 
            v-for="visitor in recentVisitors" 
            :key="visitor.id" 
            class="visitor-item"
          >
            <img :src="visitor.avatar" alt="Visitor Avatar" class="visitor-avatar" />
            <div class="visitor-info">
              <div class="visitor-username">{{ visitor.username }}</div>
              <div class="visitor-time">
                {{ new Date(visitor.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </div>
            <el-button type="primary" size="small" class="follow-visitor-btn">Follow</el-button>
          </div>
        </div>
      </section>
      
      <!-- Suggestions Section -->
      <section class="suggestions-section">
        <h2 class="section-title">Suggestions</h2>
        <div class="suggestions-list">
          <div class="suggestion-item">
            <div class="suggestion-info">
              <span class="suggestion-text">Follow more users to see more content</span>
            </div>
          </div>
        </div>
      </section>
    </aside>
  </div>
</template>

<style scoped>
/* Base Styles */
.content-container {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 20px;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: #333;
  overflow-x: hidden;
}

/* Glassmorphism Effect */
.profile-section, .search-section, .nav-section, .other-users-section, .content-section, .upload-section, .visitors-section, .suggestions-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Left Column Styles */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}

.logo-section .logo {
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  text-align: center;
}

.profile-section .profile-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.profile-section .avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.profile-section .profile-info .username {
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 5px 0;
}

.profile-section .profile-info .bio {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0;
}

.profile-section .profile-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.profile-section .stat-item {
  text-align: center;
}

.profile-section .stat-number {
  display: block;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.profile-section .stat-label {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.profile-section .edit-profile-btn {
  width: 100%;
  border-radius: 12px;
}

.search-section .search-box {
  display: flex;
  gap: 10px;
}

.search-section .search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 14px;
}

.search-section .search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-section .search-btn {
  padding: 10px 15px;
  background: rgba(64, 158, 255, 0.95);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-section .search-btn:hover {
  background: rgba(64, 158, 255, 1);
  transform: translateY(-2px);
}

.nav-section .nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-section .nav-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.nav-section .nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-section .nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: bold;
}

.nav-section .nav-icon {
  font-size: 20px;
}

.nav-section .nav-text {
  font-size: 16px;
}

/* Middle Column Styles */
.middle-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}

.section-title {
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 15px 0;
}

/* Other Users Section */
.other-users-section {
  position: sticky;
  top: 20px;
  z-index: 10;
}

.users-scroll-container {
  overflow-x: auto;
  padding-bottom: 10px;
}

.users-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.users-scroll-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.users-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.users-list {
  display: flex;
  gap: 20px;
  min-width: max-content;
}

.user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 100px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.user-name {
  color: white;
  font-size: 14px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.follow-btn {
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  transition: all 0.3s ease;
}

/* Content Section */
.content-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-item {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.content-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.content-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid white;
}

.content-username {
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.content-more {
  color: white;
  font-size: 20px;
  cursor: pointer;
}

.content-image-container {
  margin-bottom: 15px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
}

.content-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}

.content-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 5px;
  border-radius: 50%;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.action-btn.liked {
  transform: scale(1.2);
}

.content-stats {
  margin-bottom: 10px;
}

.likes-count {
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.content-description {
  margin-bottom: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.content-text {
  color: white;
  font-size: 14px;
  line-height: 1.5;
}

.content-comments {
  margin-bottom: 10px;
}

.comment-count {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-bottom: 10px;
  cursor: pointer;
}

.comment-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.comment-text-input {
  flex: 1;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 14px;
}

.comment-text-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.comment-post-btn {
  background: rgba(64, 158, 255, 0.95);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.comment-post-btn:hover {
  background: rgba(64, 158, 255, 1);
}

.content-timestamp {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Right Column Styles */
.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}

.upload-section .upload-btn {
  width: 100%;
  border-radius: 12px;
  background: rgba(64, 158, 255, 0.95);
  border: none;
  transition: all 0.3s ease;
}

.upload-section .upload-btn:hover {
  background: rgba(64, 158, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

.visitors-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.visitor-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.visitor-item .visitor-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid white;
}

.visitor-item .visitor-info {
  flex: 1;
  min-width: 0;
}

.visitor-item .visitor-username {
  color: white;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 3px;
}

.visitor-item .visitor-time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.visitor-item .follow-visitor-btn {
  border-radius: 12px;
  padding: 5px 12px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.suggestions-section .suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestions-section .suggestion-item {
  color: white;
  font-size: 14px;
  text-align: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

/* Loading Container */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

/* Upload Modal Styles */
.file-input {
  margin-bottom: 10px;
}

.file-name {
  color: white;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  padding: 5px 10px;
  border-radius: 8px;
  display: inline-block;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .content-container {
    grid-template-columns: 250px 1fr 250px;
    gap: 15px;
    padding: 15px;
  }
}

@media (max-width: 1024px) {
  .content-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 20px;
    padding: 10px;
  }
  
  .left-column, .middle-column, .right-column {
    height: auto;
  }
  
  /* Collapse navigation text on smaller screens */
  .nav-section .nav-text {
    display: none;
  }
  
  .nav-section .nav-item {
    justify-content: center;
  }
  
  /* Stack left column sections horizontally */
  .left-column {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .profile-section, .search-section, .nav-section {
    flex: 1;
    min-width: 200px;
  }
  
  /* Make users scroll vertically on smaller screens */
  .users-scroll-container {
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 150px;
  }
  
  .users-list {
    flex-direction: column;
    min-width: auto;
  }
  
  .user-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .content-container {
    padding: 5px;
  }
  
  .left-column {
    flex-direction: column;
  }
  
  .profile-section, .search-section, .nav-section {
    min-width: auto;
  }
  
  .nav-section .nav-list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-section .nav-item {
    min-width: 80px;
    justify-content: center;
  }
  
  .content-item {
    padding: 15px;
  }
  
  .action-btn {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .content-container {
    padding: 0;
  }
  
  .profile-section, .search-section, .nav-section, .other-users-section, .content-section, .upload-section, .visitors-section, .suggestions-section {
    border-radius: 0;
    border-left: none;
    border-right: none;
    margin: 5px 0;
  }
  
  .logo-section .logo {
    font-size: 20px;
  }
  
  .profile-section .avatar {
    width: 60px;
    height: 60px;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .content-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: space-around;
  }
}

/* Scrollbar Styling */
.left-column::-webkit-scrollbar, .middle-column::-webkit-scrollbar, .right-column::-webkit-scrollbar {
  width: 8px;
}

.left-column::-webkit-scrollbar-track, .middle-column::-webkit-scrollbar-track, .right-column::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.left-column::-webkit-scrollbar-thumb, .middle-column::-webkit-scrollbar-thumb, .right-column::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.left-column::-webkit-scrollbar-thumb:hover, .middle-column::-webkit-scrollbar-thumb:hover, .right-column::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>