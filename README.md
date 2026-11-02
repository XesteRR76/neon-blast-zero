# ⚡ Neon Blast Zero (Ad-Free Block Blast)

> Чистый кайф от классического **Block Blast** — **100% без рекламы**, без всплывающих окон, без микротранзакций и без сбора данных. Работает полностью оффлайн на 120 FPS.

---

## 💎 Особенности ("То самое сочное")

- **OLED / Cyber-Glass Visuals**: Глубокий темный фон `#050508`, неоновые кубики со стеклянными фасками и отблесками, кинематографичные взрывы светящихся частиц при зачистке линий.
- **Гармонический процедурный синтезатор**: Ноты пентатоники на Web Audio API растут в тональности по мере комбо-серий (C → D → E → G → A → C...), а на 2+ линиях подключается плотный саб-бас. Никаких тяжелых аудиофайлов, нулевой лаг.
- **Fair RNG (Bag System)**: В отличие от коммерческих клонов, игра никогда не подставляет безвыходный расклад фигур на пустом поле.
- **Режимы игры**:
  - 🧘 **ZEN**: Бесконечный медитативный режим.
  - ⚡ **OVERDRIVE**: Режим с бомбами — блоки имеют обратный счетчик ходов. Успей очистить их ряды до детонации!
- **Haptic Feedback**: Тактильный отклик через Capacitor Haptics и Vibration API.
- **Смещение под палец (Touch Offset)**: При перетаскивании блок парит чуть выше пальца — вы всегда точно видите, куда ставите фигуру.

---

## 🚀 Сборка APK через GitHub Actions

В репозиторий уже встроен готовый CI/CD workflow: [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml).

### Как получить APK:
1. Запушьте код в ваш GitHub репозиторий:
   ```bash
   git remote add origin https://github.com/ВАШ_НИК/neon-blast-zero.git
   git branch -M main
   git push -u origin main
   ```
2. Перейдите во вкладку **Actions** в вашем GitHub репозитории.
3. Дождитесь завершения пайплайна **Build & Package Android APK** (занимает ~1-2 минуты).
4. В блоке **Artifacts** скачайте `NeonBlast-Zero-debug-apk.zip`, распакуйте и установите `NeonBlast-Zero-debug.apk` на любой Android-смартфон!

---

## 🛠 Локальный запуск (Web)

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера с горячей перезагрузкой
npm run dev

# Сборка проекта
npm run build

# Синхронизация с Android Studio
npx cap sync android
npx cap open android
```

---

## 📦 Стек
- **Engine**: TypeScript + HTML5 Canvas (120 FPS high-DPI scaling)
- **Audio**: Web Audio API Procedural Synthesis
- **Wrapper**: Capacitor 7 Android
- **CI/CD**: GitHub Actions (`assembleDebug` + Artifacts)
- **Design**: Cyberpunk Neon / Luxury Dark
