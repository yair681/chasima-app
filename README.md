# חסימה ילד — Chasima App

מערכת ניהול זמן מסך ומשימות לילדים עם שני אפליקציות React Native ושרת Node.js.

## מבנה הפרויקט

```
chasima-app/
  backend/          ← Express + Socket.io + PostgreSQL
  apps/parent/      ← אפליקציית הורה (Expo)
  apps/child/       ← אפליקציית ילד (Expo)
```

---

## 1. הרצת השרת מקומית

```bash
cd backend
cp .env.example .env
# ערוך את .env עם פרטי PostgreSQL שלך

npm install
# צור את טבלאות ה-DB:
psql $DATABASE_URL < src/db/schema.sql
npm run dev
```

---

## 2. Deploy לRender

1. צור Web Service חדש ב-Render
2. Connect לrepo ב-GitHub
3. הגדרות:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. הוסף Environment Variables:
   - `DATABASE_URL` ← PostgreSQL connection string (Render מספק DB בחינם)
   - `JWT_SECRET` ← מחרוזת אקראית ארוכה
   - `NODE_ENV=production`
5. צור PostgreSQL Database ב-Render ← קבל את ה-`DATABASE_URL`
6. הרץ את הסכמה: בRender Shell: `node -e "require('./src/db'); const {query} = require('./src/db'); require('fs').readFileSync('./src/db/schema.sql','utf8').split(';').forEach(q => q.trim() && query(q))"`

---

## 3. הרצת האפליקציות

```bash
# אפליקציית הורה
cd apps/parent
cp .env.example .env.local
# הגדר EXPO_PUBLIC_API_URL=https://your-render-url.onrender.com
npm install
npx expo start

# אפליקציית ילד
cd apps/child
npm install
npx expo start
```

---

## 4. בניית APK

```bash
# התקן EAS CLI
npm install -g eas-cli
eas login

# בנה APK
cd apps/parent
eas build -p android --profile preview   # APK לטסטים
eas build -p android --profile production # AAB לGoogle Play

cd apps/child
eas build -p android --profile preview
```

---

## Flow של המערכת

```
הורה נרשם → יוצר ילד → מקבל קוד 4 ספרות
                              ↓
                    ילד מתחבר עם הקוד
                              ↓
              ילד לוחץ "סיימתי" על משימה
                              ↓ (Socket.io real-time)
              הורה רואה "ממתין לאישור" מיד
                              ↓
              הורה לוחץ "אשר" → נקודות מתווספות לילד
                              ↓ (Socket.io real-time)
              ילד רואה מסך הצלחה + הנקודות החדשות
```

## API Endpoints

| Method | Path | תיאור |
|--------|------|-------|
| POST | `/api/auth/register` | הרשמת הורה |
| POST | `/api/auth/login` | התחברות הורה |
| POST | `/api/auth/child-login` | כניסת ילד עם קוד |
| GET | `/api/children` | רשימת ילדים (הורה) |
| POST | `/api/children` | הוספת ילד |
| GET | `/api/tasks` | משימות |
| POST | `/api/tasks` | יצירת משימה (הורה) |
| PATCH | `/api/tasks/:id/submit` | ילד שולח לאישור |
| PATCH | `/api/tasks/:id/review` | הורה מאשר/דוחה |
| PUT | `/api/screentime/:childId` | עדכון מדיניות |
| PATCH | `/api/screentime/:childId/lock` | נעילה/פתיחה |
| PATCH | `/api/screentime/:childId/bonus` | בונוס זמן |
| GET | `/api/rewards` | חנות פרסים |
| POST | `/api/rewards` | יצירת פרס (הורה) |
| POST | `/api/rewards/:id/purchase` | רכישת פרס (ילד) |

## Socket Events

| Event | כיוון | תיאור |
|-------|-------|-------|
| `task:pending` | שרת → הורה | ילד שלח משימה לאישור |
| `task:approved` | שרת → ילד | הורה אישר משימה |
| `task:rejected` | שרת → ילד | הורה דחה משימה |
| `task:new` | שרת → ילד | הורה יצר משימה חדשה |
| `screentime:lock_changed` | שרת → ילד | נעילה/פתיחה |
| `screentime:bonus` | שרת → ילד | בונוס זמן |
| `reward:purchased` | שרת → הורה | ילד רכש פרס |
