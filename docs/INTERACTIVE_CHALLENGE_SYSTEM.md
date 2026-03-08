# 🎯 Interactive Challenge System - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Hệ thống thử thách tương tác ngẫu nhiên để chống spoofing mạnh mẽ. Người dùng phải hoàn thành 3-4 thử thách ngẫu nhiên trong thời gian giới hạn.

## 🎮 Các Loại Thử Thách

| Thử thách | Icon | Mô tả | Thời gian |
|-----------|------|-------|-----------|
| **Chớp mắt** | 👁️ | Chớp mắt 2 lần | 5 giây |
| **Cười** | 😊 | Cười tươi | 3 giây |
| **Quay trái** | ⬅️ | Quay đầu sang trái (>15°) | 4 giây |
| **Quay phải** | ➡️ | Quay đầu sang phải (>15°) | 4 giây |
| **Gật đầu** | 👇 | Gật đầu lên xuống | 4 giây |
| **Mở miệng** | 😮 | Mở miệng | 3 giây |

## 🚀 Cách Sử Dụng

### 1. Khởi tạo Challenge System

```javascript
import advancedAntiSpoofing from './services/advancedAntiSpoofing';

// Khởi tạo challenges khi bắt đầu
advancedAntiSpoofing.initializeChallenges();
```

### 2. Tích hợp vào Component React

```jsx
import React, { useState, useEffect } from 'react';
import ChallengeDisplay from './components/ChallengeDisplay';
import advancedAntiSpoofing from './services/advancedAntiSpoofing';

function LivenessCheck() {
  const [challengeState, setChallengeState] = useState({
    current: null,
    progress: { completed: 0, total: 0 }
  });

  useEffect(() => {
    // Khởi tạo challenges
    advancedAntiSpoofing.initializeChallenges();
  }, []);

  const handleDetection = (landmarks, videoElement, faceBox) => {
    // Chạy detection với challenges
    const result = advancedAntiSpoofing.performAdvancedCheck(
      landmarks, 
      videoElement, 
      faceBox
    );

    // Cập nhật UI
    setChallengeState({
      current: result.currentChallenge,
      progress: result.challengeProgress
    });

    // Kiểm tra hoàn thành
    if (result.challengesPassed) {
      console.log('✅ All challenges completed!');
      // Cho phép tiếp tục...
    }

    return result;
  };

  return (
    <div>
      <ChallengeDisplay 
        currentChallenge={challengeState.current}
        progress={challengeState.progress}
      />
      {/* Video và detection logic */}
    </div>
  );
}
```

### 3. API Methods

#### `initializeChallenges()`
Khởi tạo 3-4 thử thách ngẫu nhiên
```javascript
advancedAntiSpoofing.initializeChallenges();
```

#### `getCurrentChallenge()`
Lấy thử thách hiện tại
```javascript
const challenge = advancedAntiSpoofing.getCurrentChallenge();
// {
//   type: 'blink',
//   instruction: '👁️ Chớp mắt 2 lần',
//   duration: 5000,
//   timeRemaining: 3200,
//   isExpired: false
// }
```

#### `checkChallengeCompletion(landmarks)`
Kiểm tra hoàn thành thử thách
```javascript
const completed = advancedAntiSpoofing.checkChallengeCompletion(landmarks);
```

#### `areChallengesCompleted()`
Kiểm tra tất cả thử thách đã hoàn thành
```javascript
const allDone = advancedAntiSpoofing.areChallengesCompleted();
```

#### `getChallengeProgress()`
Lấy tiến độ
```javascript
const progress = advancedAntiSpoofing.getChallengeProgress();
// { completed: 2, total: 4, percentage: 50 }
```

## 🎨 UI Component

Component `ChallengeDisplay` hiển thị:
- ✅ Thử thách hiện tại với icon
- ⏱️ Countdown timer
- 📊 Progress bar
- 🎉 Animation khi hoàn thành

### Tùy chỉnh Style

```jsx
// Thay đổi màu sắc
<div className="bg-gradient-to-r from-blue-500 to-purple-600">

// Thêm animation
<div className="animate-pulse scale-110">

// Responsive
<div className="fixed top-4 left-1/2 transform -translate-x-1/2">
```

## 🔒 Bảo Mật

### Tại sao mạnh?

1. **Ngẫu nhiên**: Mỗi session có thử thách khác nhau
2. **Thời gian giới hạn**: Không thể chuẩn bị trước
3. **Tương tác thực**: Video replay không thể fake
4. **Kết hợp nhiều yếu tố**: Cử động + biểu cảm + thời gian

### Chống các kiểu tấn công

| Tấn công | Cách chống |
|----------|-----------|
| Video replay | LBP-TOP + Thử thách ngẫu nhiên |
| Ảnh tĩnh | Yêu cầu cử động |
| Deep fake | Thời gian phản ứng + Micro-expression |
| 3D mask | Texture analysis + Liveness |

## 📊 Scoring System

```javascript
const totalScore = (
  blinkResult.score * 0.15 +
  headMovementResult.score * 0.1 +
  microExpressionResult.score * 0.1 +
  headRotationResult.score * 0.15 +
  mouthOpenResult.score * 0.1 +
  lbpTopResult.score * 0.2 +
  smileResult.score * 0.1 +
  nodResult.score * 0.1
);

// Pass conditions:
// - totalScore > 0.5
// - blinkResult.count >= 2
// - !lbpTopResult.isReplay
// - challengesPassed === true
```

## 🎯 Best Practices

1. **Khởi tạo sớm**: Gọi `initializeChallenges()` ngay khi bắt đầu
2. **Hiển thị rõ ràng**: Dùng icon + text + animation
3. **Feedback tức thì**: Hiển thị khi hoàn thành challenge
4. **Timeout handling**: Xử lý khi hết thời gian
5. **Reset đúng cách**: Gọi `reset()` khi bắt đầu session mới

## 🐛 Troubleshooting

### Challenge không hoàn thành?
- Kiểm tra landmarks có đầy đủ không
- Xem console log để debug
- Điều chỉnh threshold nếu cần

### UI không cập nhật?
- Đảm bảo gọi `performAdvancedCheck()` trong loop
- Kiểm tra state management
- Verify component re-render

### Performance issues?
- Giảm số lượng challenges
- Tăng duration
- Optimize detection frequency

## 📝 Example Flow

```
1. User bắt đầu → initializeChallenges()
2. Hiển thị challenge 1: "👁️ Chớp mắt 2 lần"
3. User chớp mắt → detectBlink() → ✅ Completed
4. Hiển thị challenge 2: "😊 Cười tươi"
5. User cười → detectSmile() → ✅ Completed
6. Hiển thị challenge 3: "⬅️ Quay đầu sang trái"
7. User quay đầu → detectHeadRotation() → ✅ Completed
8. Tất cả hoàn thành → 🎉 Success!
```

## 🔧 Configuration

Tùy chỉnh trong constructor:

```javascript
// Thay đổi số lượng challenges
const numChallenges = 3 + Math.floor(Math.random() * 2); // 3-4 challenges

// Thay đổi duration
{ type: 'blink', instruction: '👁️ Chớp mắt 2 lần', duration: 5000 }

// Thay đổi threshold
const isSmiling = smileRatio > 0.3; // Giảm xuống 0.2 nếu quá khó
```

## 📚 Related Files

- `advancedAntiSpoofing.js` - Core logic
- `ChallengeDisplay.jsx` - UI component
- `LivenessCheck.jsx` - Integration example

## 🎓 Advanced Usage

### Custom Challenges

```javascript
// Thêm challenge mới
const customChallenge = {
  type: 'wink',
  instruction: '😉 Nháy mắt một bên',
  duration: 3000
};

challengeTypes.push(customChallenge);
```

### Event Callbacks

```javascript
// Lắng nghe sự kiện
advancedAntiSpoofing.onChallengeComplete = (type) => {
  console.log(`Challenge ${type} completed!`);
  playSuccessSound();
};
```

---

**🚀 Ready to use! Hệ thống challenge giúp tăng bảo mật lên 10x!**
