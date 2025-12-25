import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../data/descriptions');

/**
 * Description library for each domain
 * Each description represents a different widget layout/content combination
 */
const descriptionLibrary = {
  health: {
    domain: 'health',
    descriptions: [
      // Heart Rate variations
      { id: 'health-001', prompt: 'A widget showing current heart rate', complexity: 'simple', metrics: ['heart-rate'] },
      { id: 'health-002', prompt: 'A widget showing current heart rate with BPM label', complexity: 'simple', metrics: ['heart-rate'] },
      { id: 'health-003', prompt: 'A widget showing heart rate with a trend sparkline', complexity: 'medium', metrics: ['heart-rate'], visualization: ['sparkline'] },
      { id: 'health-004', prompt: 'A widget displaying heart rate with weekly trend chart', complexity: 'medium', metrics: ['heart-rate'], visualization: ['chart'] },
      { id: 'health-005', prompt: 'A compact widget showing current heart rate and resting heart rate', complexity: 'medium', metrics: ['heart-rate'] },

      // Steps variations
      { id: 'health-006', prompt: 'A widget showing steps taken today', complexity: 'simple', metrics: ['steps'] },
      { id: 'health-007', prompt: 'A widget showing steps with goal progress', complexity: 'medium', metrics: ['steps'], visualization: ['progress'] },
      { id: 'health-008', prompt: 'A widget displaying steps with a progress bar and goal', complexity: 'medium', metrics: ['steps'], visualization: ['progress-bar'] },
      { id: 'health-009', prompt: 'A widget showing steps with weekly bar chart', complexity: 'medium', metrics: ['steps'], visualization: ['chart'] },
      { id: 'health-010', prompt: 'A widget showing steps count and distance walked', complexity: 'medium', metrics: ['steps', 'distance'] },

      // Activity Rings
      { id: 'health-011', prompt: 'A widget with activity rings for move, exercise, and stand', complexity: 'medium', metrics: ['activity'], visualization: ['rings'] },
      { id: 'health-012', prompt: 'A widget showing activity rings with percentage labels', complexity: 'medium', metrics: ['activity'], visualization: ['rings'] },
      { id: 'health-013', prompt: 'A large widget with activity rings and detailed stats', complexity: 'complex', metrics: ['activity'], visualization: ['rings'] },
      { id: 'health-014', prompt: 'A compact widget showing just the move ring', complexity: 'simple', metrics: ['activity'], visualization: ['ring'] },

      // Calories
      { id: 'health-015', prompt: 'A widget showing calories burned today', complexity: 'simple', metrics: ['calories'] },
      { id: 'health-016', prompt: 'A widget displaying calories burned with progress ring', complexity: 'medium', metrics: ['calories'], visualization: ['ring'] },
      { id: 'health-017', prompt: 'A widget showing calories burned vs goal', complexity: 'medium', metrics: ['calories'], visualization: ['progress'] },
      { id: 'health-018', prompt: 'A widget displaying calories with weekly trend', complexity: 'medium', metrics: ['calories'], visualization: ['chart'] },

      // Sleep
      { id: 'health-019', prompt: 'A widget showing hours slept last night', complexity: 'simple', metrics: ['sleep'] },
      { id: 'health-020', prompt: 'A widget displaying sleep hours with bar chart', complexity: 'medium', metrics: ['sleep'], visualization: ['chart'] },
      { id: 'health-021', prompt: 'A widget showing sleep quality and duration', complexity: 'medium', metrics: ['sleep'] },
      { id: 'health-022', prompt: 'A widget displaying weekly sleep pattern', complexity: 'complex', metrics: ['sleep'], visualization: ['chart'] },

      // Workouts
      { id: 'health-023', prompt: 'A widget showing last workout summary', complexity: 'medium', metrics: ['workout'] },
      { id: 'health-024', prompt: 'A widget displaying workout time and calories', complexity: 'medium', metrics: ['workout'] },
      { id: 'health-025', prompt: 'A widget showing workout type with duration', complexity: 'medium', metrics: ['workout'] },
      { id: 'health-026', prompt: 'A widget with workout stats and start button', complexity: 'complex', metrics: ['workout'] },

      // Multi-metric combinations
      { id: 'health-027', prompt: 'A widget showing heart rate and steps side by side', complexity: 'medium', metrics: ['heart-rate', 'steps'] },
      { id: 'health-028', prompt: 'A widget displaying steps, calories, and distance', complexity: 'complex', metrics: ['steps', 'calories', 'distance'] },
      { id: 'health-029', prompt: 'A dashboard widget with heart rate, steps, and sleep', complexity: 'complex', metrics: ['heart-rate', 'steps', 'sleep'] },
      { id: 'health-030', prompt: 'A widget showing activity rings with step count below', complexity: 'complex', metrics: ['activity', 'steps'], visualization: ['rings'] },
      { id: 'health-031', prompt: 'A widget displaying heart rate with trend and current steps', complexity: 'complex', metrics: ['heart-rate', 'steps'], visualization: ['sparkline'] },
      { id: 'health-032', prompt: 'A comprehensive health summary with multiple metrics', complexity: 'complex', metrics: ['heart-rate', 'steps', 'calories', 'sleep'] },

      // Water intake
      { id: 'health-033', prompt: 'A widget showing daily water intake', complexity: 'simple', metrics: ['water'] },
      { id: 'health-034', prompt: 'A widget displaying water intake with progress', complexity: 'medium', metrics: ['water'], visualization: ['progress'] },
      { id: 'health-035', prompt: 'A widget showing water intake goal with glasses visualization', complexity: 'medium', metrics: ['water'], visualization: ['progress-bar'] },

      // Weight/Body metrics
      { id: 'health-036', prompt: 'A widget showing current weight', complexity: 'simple', metrics: ['weight'] },
      { id: 'health-037', prompt: 'A widget displaying weight with trend graph', complexity: 'medium', metrics: ['weight'], visualization: ['chart'] },
      { id: 'health-038', prompt: 'A widget showing weight change over 30 days', complexity: 'medium', metrics: ['weight'], visualization: ['sparkline'] },

      // Blood pressure
      { id: 'health-039', prompt: 'A widget showing blood pressure reading', complexity: 'simple', metrics: ['blood-pressure'] },
      { id: 'health-040', prompt: 'A widget displaying systolic and diastolic pressure', complexity: 'medium', metrics: ['blood-pressure'] },
    ]
  },

  finance: {
    domain: 'finance',
    descriptions: [
      // Single stock
      { id: 'finance-001', prompt: 'A widget showing a single stock price', complexity: 'simple', metrics: ['stock'] },
      { id: 'finance-002', prompt: 'A widget showing stock price with company name', complexity: 'simple', metrics: ['stock'] },
      { id: 'finance-003', prompt: 'A widget displaying stock price with percent change', complexity: 'medium', metrics: ['stock'] },
      { id: 'finance-004', prompt: 'A widget showing stock price with trend sparkline', complexity: 'medium', metrics: ['stock'], visualization: ['sparkline'] },
      { id: 'finance-005', prompt: 'A widget displaying stock with daily chart', complexity: 'medium', metrics: ['stock'], visualization: ['chart'] },
      { id: 'finance-006', prompt: 'A widget showing stock price, change, and volume', complexity: 'complex', metrics: ['stock', 'volume'], visualization: ['chart'] },

      // Multiple stocks
      { id: 'finance-007', prompt: 'A widget showing three stock tickers', complexity: 'medium', metrics: ['stocks'] },
      { id: 'finance-008', prompt: 'A widget displaying watchlist with 5 stocks', complexity: 'complex', metrics: ['stocks'] },
      { id: 'finance-009', prompt: 'A widget showing stock comparison between two companies', complexity: 'complex', metrics: ['stocks'], visualization: ['chart'] },

      // Portfolio
      { id: 'finance-010', prompt: 'A widget showing total portfolio value', complexity: 'simple', metrics: ['portfolio'] },
      { id: 'finance-011', prompt: 'A widget displaying portfolio value with daily change', complexity: 'medium', metrics: ['portfolio'] },
      { id: 'finance-012', prompt: 'A widget showing portfolio value with performance chart', complexity: 'medium', metrics: ['portfolio'], visualization: ['chart'] },
      { id: 'finance-013', prompt: 'A widget displaying portfolio allocation pie chart', complexity: 'medium', metrics: ['portfolio'], visualization: ['pie-chart'] },
      { id: 'finance-014', prompt: 'A widget showing portfolio summary with top holdings', complexity: 'complex', metrics: ['portfolio'] },

      // Crypto
      { id: 'finance-015', prompt: 'A widget showing Bitcoin price', complexity: 'simple', metrics: ['crypto'] },
      { id: 'finance-016', prompt: 'A widget displaying Bitcoin with 24h change', complexity: 'medium', metrics: ['crypto'] },
      { id: 'finance-017', prompt: 'A widget showing Bitcoin price with trend chart', complexity: 'medium', metrics: ['crypto'], visualization: ['chart'] },
      { id: 'finance-018', prompt: 'A widget displaying multiple crypto prices', complexity: 'complex', metrics: ['crypto'] },

      // Market indices
      { id: 'finance-019', prompt: 'A widget showing S&P 500 index', complexity: 'simple', metrics: ['index'] },
      { id: 'finance-020', prompt: 'A widget displaying major market indices', complexity: 'medium', metrics: ['indices'] },
      { id: 'finance-021', prompt: 'A widget showing Dow Jones with trend', complexity: 'medium', metrics: ['index'], visualization: ['sparkline'] },

      // Transactions/Budget
      { id: 'finance-022', prompt: 'A widget showing recent transactions', complexity: 'medium', metrics: ['transactions'] },
      { id: 'finance-023', prompt: 'A widget displaying monthly spending', complexity: 'medium', metrics: ['spending'] },
      { id: 'finance-024', prompt: 'A widget showing budget vs actual spending', complexity: 'complex', metrics: ['budget'], visualization: ['progress'] },
      { id: 'finance-025', prompt: 'A widget displaying spending by category', complexity: 'complex', metrics: ['spending'], visualization: ['pie-chart'] },

      // Account balance
      { id: 'finance-026', prompt: 'A widget showing account balance', complexity: 'simple', metrics: ['balance'] },
      { id: 'finance-027', prompt: 'A widget displaying checking and savings balances', complexity: 'medium', metrics: ['balance'] },
      { id: 'finance-028', prompt: 'A widget showing total net worth', complexity: 'simple', metrics: ['net-worth'] },

      // Currency
      { id: 'finance-029', prompt: 'A widget showing currency exchange rate', complexity: 'simple', metrics: ['currency'] },
      { id: 'finance-030', prompt: 'A widget displaying USD to EUR conversion', complexity: 'medium', metrics: ['currency'] },
    ]
  },

  weather: {
    domain: 'weather',
    descriptions: [
      // Current weather
      { id: 'weather-001', prompt: 'A widget showing current temperature', complexity: 'simple', metrics: ['temperature'] },
      { id: 'weather-002', prompt: 'A widget showing current weather with condition icon', complexity: 'simple', metrics: ['temperature', 'condition'] },
      { id: 'weather-003', prompt: 'A widget displaying temperature and location', complexity: 'simple', metrics: ['temperature'] },
      { id: 'weather-004', prompt: 'A widget showing temperature, condition, and feels like', complexity: 'medium', metrics: ['temperature', 'condition'] },
      { id: 'weather-005', prompt: 'A widget displaying current weather with high and low temps', complexity: 'medium', metrics: ['temperature'] },

      // Hourly forecast
      { id: 'weather-006', prompt: 'A widget showing hourly forecast for next 6 hours', complexity: 'medium', metrics: ['hourly'] },
      { id: 'weather-007', prompt: 'A widget displaying hourly temperature chart', complexity: 'medium', metrics: ['hourly'], visualization: ['chart'] },
      { id: 'weather-008', prompt: 'A widget showing next 3 hours with icons', complexity: 'medium', metrics: ['hourly'] },

      // Daily forecast
      { id: 'weather-009', prompt: 'A widget showing 5-day forecast', complexity: 'medium', metrics: ['daily'] },
      { id: 'weather-010', prompt: 'A widget displaying weekly weather overview', complexity: 'complex', metrics: ['daily'] },
      { id: 'weather-011', prompt: 'A widget showing 3-day forecast with high/low temps', complexity: 'medium', metrics: ['daily'] },

      // Detailed conditions
      { id: 'weather-012', prompt: 'A widget showing humidity and wind speed', complexity: 'medium', metrics: ['humidity', 'wind'] },
      { id: 'weather-013', prompt: 'A widget displaying UV index and air quality', complexity: 'medium', metrics: ['uv', 'air-quality'] },
      { id: 'weather-014', prompt: 'A widget showing precipitation chance', complexity: 'simple', metrics: ['precipitation'] },
      { id: 'weather-015', prompt: 'A widget displaying sunrise and sunset times', complexity: 'medium', metrics: ['sun'] },

      // Combined metrics
      { id: 'weather-016', prompt: 'A comprehensive weather widget with temp, condition, and forecast', complexity: 'complex', metrics: ['temperature', 'condition', 'daily'] },
      { id: 'weather-017', prompt: 'A widget showing current weather and hourly forecast', complexity: 'complex', metrics: ['temperature', 'hourly'] },
      { id: 'weather-018', prompt: 'A widget displaying temperature, wind, and humidity', complexity: 'complex', metrics: ['temperature', 'wind', 'humidity'] },
      { id: 'weather-019', prompt: 'A widget showing weather with precipitation radar', complexity: 'complex', metrics: ['temperature', 'precipitation'], visualization: ['map'] },
      { id: 'weather-020', prompt: 'A minimal weather widget with just temp and icon', complexity: 'simple', metrics: ['temperature', 'condition'] },
    ]
  },

  productivity: {
    domain: 'productivity',
    descriptions: [
      // Tasks
      { id: 'productivity-001', prompt: 'A widget showing task list', complexity: 'medium', metrics: ['tasks'] },
      { id: 'productivity-002', prompt: 'A widget displaying today\'s tasks', complexity: 'medium', metrics: ['tasks'] },
      { id: 'productivity-003', prompt: 'A widget showing tasks with checkboxes', complexity: 'medium', metrics: ['tasks'] },
      { id: 'productivity-004', prompt: 'A widget displaying task count and completion progress', complexity: 'medium', metrics: ['tasks'], visualization: ['progress'] },
      { id: 'productivity-005', prompt: 'A widget showing overdue tasks', complexity: 'medium', metrics: ['tasks'] },

      // Calendar
      { id: 'productivity-006', prompt: 'A widget showing next calendar event', complexity: 'medium', metrics: ['calendar'] },
      { id: 'productivity-007', prompt: 'A widget displaying today\'s schedule', complexity: 'complex', metrics: ['calendar'] },
      { id: 'productivity-008', prompt: 'A widget showing upcoming meetings', complexity: 'medium', metrics: ['calendar'] },
      { id: 'productivity-009', prompt: 'A widget displaying calendar month view', complexity: 'complex', metrics: ['calendar'] },

      // Reminders
      { id: 'productivity-010', prompt: 'A widget showing reminders list', complexity: 'medium', metrics: ['reminders'] },
      { id: 'productivity-011', prompt: 'A widget displaying next reminder', complexity: 'simple', metrics: ['reminders'] },
      { id: 'productivity-012', prompt: 'A widget showing reminders with due times', complexity: 'medium', metrics: ['reminders'] },

      // Notes
      { id: 'productivity-013', prompt: 'A widget showing recent note', complexity: 'simple', metrics: ['notes'] },
      { id: 'productivity-014', prompt: 'A widget displaying note list', complexity: 'medium', metrics: ['notes'] },
      { id: 'productivity-015', prompt: 'A widget showing pinned note', complexity: 'medium', metrics: ['notes'] },

      // Time tracking
      { id: 'productivity-016', prompt: 'A widget showing focus time today', complexity: 'simple', metrics: ['focus'] },
      { id: 'productivity-017', prompt: 'A widget displaying pomodoro timer', complexity: 'medium', metrics: ['timer'] },
      { id: 'productivity-018', prompt: 'A widget showing time tracking summary', complexity: 'complex', metrics: ['time-tracking'], visualization: ['chart'] },

      // Combined
      { id: 'productivity-019', prompt: 'A widget showing tasks and next event', complexity: 'complex', metrics: ['tasks', 'calendar'] },
      { id: 'productivity-020', prompt: 'A widget displaying daily productivity summary', complexity: 'complex', metrics: ['tasks', 'focus', 'calendar'] },
    ]
  },

  media: {
    domain: 'media',
    descriptions: [
      // Music - Now Playing
      { id: 'media-001', prompt: 'A widget showing now playing song', complexity: 'medium', metrics: ['music'] },
      { id: 'media-002', prompt: 'A widget displaying now playing with album art', complexity: 'medium', metrics: ['music'] },
      { id: 'media-003', prompt: 'A widget showing song with playback controls', complexity: 'complex', metrics: ['music'] },
      { id: 'media-004', prompt: 'A widget displaying music player with progress bar', complexity: 'complex', metrics: ['music'], visualization: ['progress'] },
      { id: 'media-005', prompt: 'A compact music widget with just song and artist', complexity: 'simple', metrics: ['music'] },

      // Playlists
      { id: 'media-006', prompt: 'A widget showing favorite playlist', complexity: 'medium', metrics: ['playlist'] },
      { id: 'media-007', prompt: 'A widget displaying recently played songs', complexity: 'medium', metrics: ['history'] },
      { id: 'media-008', prompt: 'A widget showing playlist with song count', complexity: 'medium', metrics: ['playlist'] },

      // Podcasts
      { id: 'media-009', prompt: 'A widget showing current podcast episode', complexity: 'medium', metrics: ['podcast'] },
      { id: 'media-010', prompt: 'A widget displaying podcast with playback position', complexity: 'complex', metrics: ['podcast'], visualization: ['progress'] },
      { id: 'media-011', prompt: 'A widget showing new podcast episodes', complexity: 'medium', metrics: ['podcast'] },

      // Video
      { id: 'media-012', prompt: 'A widget showing recently watched videos', complexity: 'medium', metrics: ['video'] },
      { id: 'media-013', prompt: 'A widget displaying continue watching', complexity: 'medium', metrics: ['video'] },

      // Photos
      { id: 'media-014', prompt: 'A widget showing photo of the day', complexity: 'simple', metrics: ['photo'] },
      { id: 'media-015', prompt: 'A widget displaying recent photos grid', complexity: 'medium', metrics: ['photos'] },
      { id: 'media-016', prompt: 'A widget showing photo memories', complexity: 'medium', metrics: ['photo'] },
    ]
  },

  communication: {
    domain: 'communication',
    descriptions: [
      // Messages
      { id: 'communication-001', prompt: 'A widget showing recent messages', complexity: 'medium', metrics: ['messages'] },
      { id: 'communication-002', prompt: 'A widget displaying unread message count', complexity: 'simple', metrics: ['messages'] },
      { id: 'communication-003', prompt: 'A widget showing last message preview', complexity: 'medium', metrics: ['messages'] },
      { id: 'communication-004', prompt: 'A widget displaying message list with avatars', complexity: 'complex', metrics: ['messages'] },

      // Calls
      { id: 'communication-005', prompt: 'A widget showing recent calls', complexity: 'medium', metrics: ['calls'] },
      { id: 'communication-006', prompt: 'A widget displaying missed calls', complexity: 'medium', metrics: ['calls'] },

      // Email
      { id: 'communication-007', prompt: 'A widget showing unread emails', complexity: 'simple', metrics: ['email'] },
      { id: 'communication-008', prompt: 'A widget displaying inbox preview', complexity: 'medium', metrics: ['email'] },
      { id: 'communication-009', prompt: 'A widget showing recent emails with subjects', complexity: 'complex', metrics: ['email'] },

      // Contacts
      { id: 'communication-010', prompt: 'A widget showing favorite contacts', complexity: 'medium', metrics: ['contacts'] },
      { id: 'communication-011', prompt: 'A widget displaying quick dial contacts', complexity: 'medium', metrics: ['contacts'] },

      // Notifications
      { id: 'communication-012', prompt: 'A widget showing notification count', complexity: 'simple', metrics: ['notifications'] },
      { id: 'communication-013', prompt: 'A widget displaying recent notifications', complexity: 'medium', metrics: ['notifications'] },
    ]
  },

  'smart-home': {
    domain: 'smart-home',
    descriptions: [
      // Climate
      { id: 'smart-home-001', prompt: 'A widget showing thermostat temperature', complexity: 'simple', metrics: ['thermostat'] },
      { id: 'smart-home-002', prompt: 'A widget displaying thermostat with controls', complexity: 'medium', metrics: ['thermostat'] },
      { id: 'smart-home-003', prompt: 'A widget showing indoor and outdoor temperature', complexity: 'medium', metrics: ['temperature'] },

      // Lights
      { id: 'smart-home-004', prompt: 'A widget showing light status', complexity: 'simple', metrics: ['lights'] },
      { id: 'smart-home-005', prompt: 'A widget displaying room lights with on/off toggle', complexity: 'medium', metrics: ['lights'] },
      { id: 'smart-home-006', prompt: 'A widget showing multiple lights status', complexity: 'complex', metrics: ['lights'] },
      { id: 'smart-home-007', prompt: 'A widget displaying light brightness control', complexity: 'medium', metrics: ['lights'], visualization: ['slider'] },

      // Security
      { id: 'smart-home-008', prompt: 'A widget showing security system status', complexity: 'simple', metrics: ['security'] },
      { id: 'smart-home-009', prompt: 'A widget displaying camera feeds', complexity: 'complex', metrics: ['cameras'] },
      { id: 'smart-home-010', prompt: 'A widget showing door lock status', complexity: 'medium', metrics: ['locks'] },

      // Energy
      { id: 'smart-home-011', prompt: 'A widget showing current energy usage', complexity: 'simple', metrics: ['energy'] },
      { id: 'smart-home-012', prompt: 'A widget displaying energy usage chart', complexity: 'medium', metrics: ['energy'], visualization: ['chart'] },

      // Devices
      { id: 'smart-home-013', prompt: 'A widget showing smart home device status', complexity: 'medium', metrics: ['devices'] },
      { id: 'smart-home-014', prompt: 'A widget displaying room overview', complexity: 'complex', metrics: ['room'] },
      { id: 'smart-home-015', prompt: 'A widget showing scenes and automation', complexity: 'medium', metrics: ['scenes'] },
    ]
  },

  navigation: {
    domain: 'navigation',
    descriptions: [
      // Location
      { id: 'navigation-001', prompt: 'A widget showing current location', complexity: 'simple', metrics: ['location'] },
      { id: 'navigation-002', prompt: 'A widget displaying location with map', complexity: 'medium', metrics: ['location'], visualization: ['map'] },

      // Directions
      { id: 'navigation-003', prompt: 'A widget showing next turn direction', complexity: 'medium', metrics: ['directions'] },
      { id: 'navigation-004', prompt: 'A widget displaying ETA and distance', complexity: 'medium', metrics: ['directions'] },
      { id: 'navigation-005', prompt: 'A widget showing route overview', complexity: 'complex', metrics: ['directions'], visualization: ['map'] },

      // Traffic
      { id: 'navigation-006', prompt: 'A widget showing traffic conditions', complexity: 'medium', metrics: ['traffic'] },
      { id: 'navigation-007', prompt: 'A widget displaying commute time', complexity: 'simple', metrics: ['commute'] },
      { id: 'navigation-008', prompt: 'A widget showing ETA to home', complexity: 'medium', metrics: ['eta'] },

      // Places
      { id: 'navigation-009', prompt: 'A widget showing nearby places', complexity: 'medium', metrics: ['places'] },
      { id: 'navigation-010', prompt: 'A widget displaying saved locations', complexity: 'medium', metrics: ['locations'] },
      { id: 'navigation-011', prompt: 'A widget showing parking location', complexity: 'medium', metrics: ['parking'] },

      // Transit
      { id: 'navigation-012', prompt: 'A widget showing next bus arrival', complexity: 'medium', metrics: ['transit'] },
      { id: 'navigation-013', prompt: 'A widget displaying transit schedule', complexity: 'complex', metrics: ['transit'] },
    ]
  },

  utilities: {
    domain: 'utilities',
    descriptions: [
      // Battery
      { id: 'utilities-001', prompt: 'A widget showing battery percentage', complexity: 'simple', metrics: ['battery'] },
      { id: 'utilities-002', prompt: 'A widget displaying battery with time remaining', complexity: 'medium', metrics: ['battery'] },
      { id: 'utilities-003', prompt: 'A widget showing battery level with icon', complexity: 'simple', metrics: ['battery'] },
      { id: 'utilities-004', prompt: 'A widget displaying battery charge status', complexity: 'medium', metrics: ['battery'] },

      // Storage
      { id: 'utilities-005', prompt: 'A widget showing storage usage', complexity: 'simple', metrics: ['storage'] },
      { id: 'utilities-006', prompt: 'A widget displaying storage with progress bar', complexity: 'medium', metrics: ['storage'], visualization: ['progress'] },
      { id: 'utilities-007', prompt: 'A widget showing available storage space', complexity: 'medium', metrics: ['storage'] },

      // Network
      { id: 'utilities-008', prompt: 'A widget showing WiFi status', complexity: 'simple', metrics: ['wifi'] },
      { id: 'utilities-009', prompt: 'A widget displaying network speed', complexity: 'medium', metrics: ['network'] },
      { id: 'utilities-010', prompt: 'A widget showing connection status', complexity: 'simple', metrics: ['connection'] },

      // System
      { id: 'utilities-011', prompt: 'A widget showing system info', complexity: 'medium', metrics: ['system'] },
      { id: 'utilities-012', prompt: 'A widget displaying CPU usage', complexity: 'medium', metrics: ['cpu'], visualization: ['chart'] },
      { id: 'utilities-013', prompt: 'A widget showing memory usage', complexity: 'medium', metrics: ['memory'], visualization: ['progress'] },

      // Settings shortcuts
      { id: 'utilities-014', prompt: 'A widget with quick settings toggles', complexity: 'medium', metrics: ['settings'] },
      { id: 'utilities-015', prompt: 'A widget showing device controls', complexity: 'complex', metrics: ['controls'] },
    ]
  },

  sports: {
    domain: 'sports',
    descriptions: [
      // Scores
      { id: 'sports-001', prompt: 'A widget showing live game score', complexity: 'medium', metrics: ['score'] },
      { id: 'sports-002', prompt: 'A widget displaying recent game results', complexity: 'medium', metrics: ['scores'] },
      { id: 'sports-003', prompt: 'A widget showing upcoming games', complexity: 'medium', metrics: ['schedule'] },

      // Team/League
      { id: 'sports-004', prompt: 'A widget showing team standings', complexity: 'complex', metrics: ['standings'] },
      { id: 'sports-005', prompt: 'A widget displaying league table', complexity: 'complex', metrics: ['league'] },
      { id: 'sports-006', prompt: 'A widget showing team stats', complexity: 'complex', metrics: ['stats'] },

      // Player stats
      { id: 'sports-007', prompt: 'A widget showing player statistics', complexity: 'medium', metrics: ['player'] },
      { id: 'sports-008', prompt: 'A widget displaying fantasy points', complexity: 'medium', metrics: ['fantasy'] },

      // Live updates
      { id: 'sports-009', prompt: 'A widget showing live match updates', complexity: 'complex', metrics: ['live'] },
      { id: 'sports-010', prompt: 'A widget displaying game clock and score', complexity: 'medium', metrics: ['live'] },

      // Fitness tracking
      { id: 'sports-011', prompt: 'A widget showing workout stats', complexity: 'medium', metrics: ['workout'] },
      { id: 'sports-012', prompt: 'A widget displaying running distance and pace', complexity: 'medium', metrics: ['running'] },
      { id: 'sports-013', prompt: 'A widget showing cycling stats', complexity: 'medium', metrics: ['cycling'] },
    ]
  },

  travel: {
    domain: 'travel',
    descriptions: [
      // Flights - single
      { id: 'travel-001', prompt: 'A widget showing next flight details', complexity: 'medium', metrics: ['flight'] },
      { id: 'travel-002', prompt: 'A widget displaying flight number and gate', complexity: 'simple', metrics: ['flight'] },
      { id: 'travel-003', prompt: 'A widget showing departure time and destination', complexity: 'medium', metrics: ['flight'] },
      { id: 'travel-004', prompt: 'A widget displaying boarding pass information', complexity: 'complex', metrics: ['flight'], visualization: ['barcode'] },
      { id: 'travel-005', prompt: 'A widget showing flight status', complexity: 'simple', metrics: ['flight'] },
      { id: 'travel-006', prompt: 'A widget displaying seat number and gate', complexity: 'simple', metrics: ['flight'] },
      { id: 'travel-007', prompt: 'A widget showing flight route with departure and arrival', complexity: 'medium', metrics: ['flight'] },
      { id: 'travel-008', prompt: 'A widget displaying boarding time countdown', complexity: 'medium', metrics: ['flight'], visualization: ['countdown'] },

      // Flights - multiple/tracking
      { id: 'travel-009', prompt: 'A widget showing upcoming flights list', complexity: 'complex', metrics: ['flights'] },
      { id: 'travel-010', prompt: 'A widget displaying flight tracking with progress', complexity: 'complex', metrics: ['flight'], visualization: ['progress'] },
      { id: 'travel-011', prompt: 'A widget showing flight timeline with connections', complexity: 'complex', metrics: ['flight'], visualization: ['timeline'] },

      // Hotels
      { id: 'travel-012', prompt: 'A widget showing hotel reservation', complexity: 'medium', metrics: ['hotel'] },
      { id: 'travel-013', prompt: 'A widget displaying check-in and check-out times', complexity: 'simple', metrics: ['hotel'] },
      { id: 'travel-014', prompt: 'A widget showing hotel details with photo', complexity: 'medium', metrics: ['hotel'] },
      { id: 'travel-015', prompt: 'A widget displaying hotel address and directions button', complexity: 'medium', metrics: ['hotel'] },
      { id: 'travel-016', prompt: 'A widget showing hotel confirmation number', complexity: 'simple', metrics: ['hotel'] },
      { id: 'travel-017', prompt: 'A widget displaying hotel amenities and rating', complexity: 'medium', metrics: ['hotel'] },
      { id: 'travel-018', prompt: 'A widget showing nights count and total cost', complexity: 'simple', metrics: ['hotel'] },

      // Trip planning
      { id: 'travel-019', prompt: 'A widget showing trip itinerary for the day', complexity: 'complex', metrics: ['itinerary'] },
      { id: 'travel-020', prompt: 'A widget displaying trip countdown', complexity: 'simple', metrics: ['trip'] },
      { id: 'travel-021', prompt: 'A widget showing trip summary with dates', complexity: 'medium', metrics: ['trip'] },
      { id: 'travel-022', prompt: 'A widget displaying packing list progress', complexity: 'medium', metrics: ['packing'], visualization: ['progress'] },
      { id: 'travel-023', prompt: 'A widget showing trip budget and expenses', complexity: 'complex', metrics: ['budget'], visualization: ['chart'] },
      { id: 'travel-024', prompt: 'A widget displaying travel documents checklist', complexity: 'medium', metrics: ['checklist'] },

      // Destination
      { id: 'travel-025', prompt: 'A widget showing destination weather', complexity: 'medium', metrics: ['weather'] },
      { id: 'travel-026', prompt: 'A widget displaying destination time and timezone', complexity: 'simple', metrics: ['time'] },
      { id: 'travel-027', prompt: 'A widget showing destination photo with name', complexity: 'simple', metrics: ['destination'] },
      { id: 'travel-028', prompt: 'A widget displaying local currency and exchange rate', complexity: 'medium', metrics: ['currency'] },
      { id: 'travel-029', prompt: 'A widget showing destination attractions', complexity: 'medium', metrics: ['attractions'] },
      { id: 'travel-030', prompt: 'A widget displaying travel tips for destination', complexity: 'medium', metrics: ['tips'] },

      // Transportation
      { id: 'travel-031', prompt: 'A widget showing rental car reservation', complexity: 'medium', metrics: ['car'] },
      { id: 'travel-032', prompt: 'A widget displaying train ticket details', complexity: 'medium', metrics: ['train'] },
      { id: 'travel-033', prompt: 'A widget showing bus schedule', complexity: 'medium', metrics: ['bus'] },
      { id: 'travel-034', prompt: 'A widget displaying ride share pickup info', complexity: 'medium', metrics: ['rideshare'] },

      // Combined trip views
      { id: 'travel-035', prompt: 'A widget showing flight and hotel together', complexity: 'complex', metrics: ['flight', 'hotel'] },
      { id: 'travel-036', prompt: 'A widget displaying trip overview with all bookings', complexity: 'complex', metrics: ['trip', 'bookings'] },
      { id: 'travel-037', prompt: 'A widget showing next trip with countdown and details', complexity: 'complex', metrics: ['trip'], visualization: ['countdown'] },
      { id: 'travel-038', prompt: 'A widget displaying travel timeline for multi-city trip', complexity: 'complex', metrics: ['trip'], visualization: ['timeline'] },
      { id: 'travel-039', prompt: 'A widget showing trip expenses breakdown', complexity: 'complex', metrics: ['expenses'], visualization: ['chart'] },
      { id: 'travel-040', prompt: 'A widget displaying loyalty points and status', complexity: 'medium', metrics: ['loyalty'] },

      // Activities & Bookings
      { id: 'travel-041', prompt: 'A widget showing booked activities', complexity: 'medium', metrics: ['activities'] },
      { id: 'travel-042', prompt: 'A widget displaying tour reservation', complexity: 'medium', metrics: ['tour'] },
      { id: 'travel-043', prompt: 'A widget showing restaurant reservation', complexity: 'simple', metrics: ['dining'] },
      { id: 'travel-044', prompt: 'A widget displaying event tickets', complexity: 'medium', metrics: ['events'] },

      // Status & Tracking
      { id: 'travel-045', prompt: 'A widget showing luggage tracking', complexity: 'medium', metrics: ['luggage'], visualization: ['tracking'] },
      { id: 'travel-046', prompt: 'A widget displaying trip status updates', complexity: 'medium', metrics: ['status'] },
      { id: 'travel-047', prompt: 'A widget showing airport terminal map', complexity: 'complex', metrics: ['map'], visualization: ['map'] },
      { id: 'travel-048', prompt: 'A widget displaying security wait times', complexity: 'simple', metrics: ['airport'] },
      { id: 'travel-049', prompt: 'A widget showing passport and visa info', complexity: 'medium', metrics: ['documents'] },
      { id: 'travel-050', prompt: 'A widget displaying travel insurance details', complexity: 'medium', metrics: ['insurance'] },
    ]
  },

  food: {
    domain: 'food',
    descriptions: [
      // Recipes - single
      { id: 'food-001', prompt: 'A widget showing recipe of the day', complexity: 'medium', metrics: ['recipe'] },
      { id: 'food-002', prompt: 'A widget displaying recipe with photo and time', complexity: 'medium', metrics: ['recipe'] },
      { id: 'food-003', prompt: 'A widget showing recipe name and rating', complexity: 'simple', metrics: ['recipe'] },
      { id: 'food-004', prompt: 'A widget displaying cooking instructions step-by-step', complexity: 'complex', metrics: ['recipe'] },
      { id: 'food-005', prompt: 'A widget showing recipe ingredients list', complexity: 'medium', metrics: ['recipe', 'ingredients'] },
      { id: 'food-006', prompt: 'A widget displaying recipe prep and cook time', complexity: 'simple', metrics: ['recipe'] },
      { id: 'food-007', prompt: 'A widget showing recipe nutrition facts', complexity: 'medium', metrics: ['recipe', 'nutrition'] },
      { id: 'food-008', prompt: 'A widget displaying recipe servings and difficulty', complexity: 'simple', metrics: ['recipe'] },

      // Recipes - collections
      { id: 'food-009', prompt: 'A widget showing saved recipes', complexity: 'complex', metrics: ['recipes'] },
      { id: 'food-010', prompt: 'A widget displaying recipe categories', complexity: 'medium', metrics: ['recipes'] },
      { id: 'food-011', prompt: 'A widget showing trending recipes', complexity: 'complex', metrics: ['recipes'] },
      { id: 'food-012', prompt: 'A widget displaying quick meal ideas', complexity: 'medium', metrics: ['recipes'] },

      // Restaurants - single
      { id: 'food-013', prompt: 'A widget showing restaurant recommendation', complexity: 'medium', metrics: ['restaurant'] },
      { id: 'food-014', prompt: 'A widget displaying restaurant with rating and price', complexity: 'medium', metrics: ['restaurant'] },
      { id: 'food-015', prompt: 'A widget showing restaurant hours and location', complexity: 'medium', metrics: ['restaurant'] },
      { id: 'food-016', prompt: 'A widget displaying restaurant reservation', complexity: 'medium', metrics: ['restaurant'] },
      { id: 'food-017', prompt: 'A widget showing restaurant menu highlights', complexity: 'complex', metrics: ['restaurant', 'menu'] },
      { id: 'food-018', prompt: 'A widget displaying restaurant reviews', complexity: 'medium', metrics: ['restaurant'] },

      // Restaurants - discovery
      { id: 'food-019', prompt: 'A widget showing nearby restaurants', complexity: 'complex', metrics: ['restaurants'] },
      { id: 'food-020', prompt: 'A widget displaying restaurants by cuisine', complexity: 'medium', metrics: ['restaurants'] },
      { id: 'food-021', prompt: 'A widget showing top rated restaurants', complexity: 'complex', metrics: ['restaurants'] },
      { id: 'food-022', prompt: 'A widget displaying restaurant deals', complexity: 'medium', metrics: ['restaurants', 'deals'] },

      // Nutrition tracking
      { id: 'food-023', prompt: 'A widget showing daily calorie count', complexity: 'simple', metrics: ['calories'] },
      { id: 'food-024', prompt: 'A widget displaying calories with goal progress', complexity: 'medium', metrics: ['calories'], visualization: ['progress'] },
      { id: 'food-025', prompt: 'A widget showing macro nutrients breakdown', complexity: 'medium', metrics: ['macros'], visualization: ['pie-chart'] },
      { id: 'food-026', prompt: 'A widget displaying protein intake', complexity: 'simple', metrics: ['protein'] },
      { id: 'food-027', prompt: 'A widget showing water intake tracker', complexity: 'medium', metrics: ['water'], visualization: ['progress'] },
      { id: 'food-028', prompt: 'A widget displaying nutrition goals', complexity: 'medium', metrics: ['nutrition'], visualization: ['progress'] },
      { id: 'food-029', prompt: 'A widget showing meal nutrition summary', complexity: 'complex', metrics: ['nutrition'] },

      // Meal planning
      { id: 'food-030', prompt: 'A widget showing today\'s meal plan', complexity: 'complex', metrics: ['meal-plan'] },
      { id: 'food-031', prompt: 'A widget displaying weekly meal prep', complexity: 'complex', metrics: ['meal-plan'] },
      { id: 'food-032', prompt: 'A widget showing breakfast suggestion', complexity: 'medium', metrics: ['meal'] },
      { id: 'food-033', prompt: 'A widget displaying lunch ideas', complexity: 'medium', metrics: ['meal'] },
      { id: 'food-034', prompt: 'A widget showing dinner plan', complexity: 'medium', metrics: ['meal'] },
      { id: 'food-035', prompt: 'A widget displaying meal prep checklist', complexity: 'medium', metrics: ['meal-plan'] },

      // Grocery & Shopping
      { id: 'food-036', prompt: 'A widget showing grocery list', complexity: 'medium', metrics: ['groceries'] },
      { id: 'food-037', prompt: 'A widget displaying shopping list with checkboxes', complexity: 'medium', metrics: ['groceries'] },
      { id: 'food-038', prompt: 'A widget showing pantry inventory', complexity: 'complex', metrics: ['pantry'] },
      { id: 'food-039', prompt: 'A widget displaying expiring ingredients', complexity: 'medium', metrics: ['pantry'] },

      // Food delivery
      { id: 'food-040', prompt: 'A widget showing active delivery order', complexity: 'medium', metrics: ['delivery'] },
      { id: 'food-041', prompt: 'A widget displaying order tracking', complexity: 'complex', metrics: ['delivery'], visualization: ['tracking'] },
      { id: 'food-042', prompt: 'A widget showing delivery ETA', complexity: 'simple', metrics: ['delivery'] },
      { id: 'food-043', prompt: 'A widget displaying recent orders', complexity: 'medium', metrics: ['orders'] },
      { id: 'food-044', prompt: 'A widget showing favorite delivery restaurants', complexity: 'complex', metrics: ['restaurants'] },

      // Dietary tracking
      { id: 'food-045', prompt: 'A widget showing intermittent fasting timer', complexity: 'medium', metrics: ['fasting'], visualization: ['timer'] },
      { id: 'food-046', prompt: 'A widget displaying diet streak', complexity: 'simple', metrics: ['diet'] },
      { id: 'food-047', prompt: 'A widget showing cheat meal allowance', complexity: 'simple', metrics: ['diet'] },
      { id: 'food-048', prompt: 'A widget displaying dietary restrictions', complexity: 'simple', metrics: ['diet'] },

      // Special features
      { id: 'food-049', prompt: 'A widget showing wine pairing suggestions', complexity: 'medium', metrics: ['pairing'] },
      { id: 'food-050', prompt: 'A widget displaying cooking timer', complexity: 'simple', metrics: ['timer'] },
      { id: 'food-051', prompt: 'A widget showing kitchen conversion tool', complexity: 'medium', metrics: ['tools'] },
      { id: 'food-052', prompt: 'A widget displaying meal cost tracker', complexity: 'medium', metrics: ['cost'], visualization: ['chart'] },
      { id: 'food-053', prompt: 'A widget showing food waste tracker', complexity: 'medium', metrics: ['waste'] },
      { id: 'food-054', prompt: 'A widget displaying seasonal ingredients', complexity: 'medium', metrics: ['ingredients'] },
      { id: 'food-055', prompt: 'A widget showing cooking progress for recipe', complexity: 'medium', metrics: ['cooking'], visualization: ['progress'] },
    ]
  },

  shopping: {
    domain: 'shopping',
    descriptions: [
      // Cart & Checkout
      { id: 'shopping-001', prompt: 'A widget showing shopping cart summary', complexity: 'medium', metrics: ['cart'] },
      { id: 'shopping-002', prompt: 'A widget displaying cart item count', complexity: 'simple', metrics: ['cart'] },
      { id: 'shopping-003', prompt: 'A widget showing cart total price', complexity: 'simple', metrics: ['cart'] },
      { id: 'shopping-004', prompt: 'A widget displaying cart items with images', complexity: 'complex', metrics: ['cart'] },
      { id: 'shopping-005', prompt: 'A widget showing cart with checkout button', complexity: 'medium', metrics: ['cart'] },
      { id: 'shopping-006', prompt: 'A widget displaying saved items in cart', complexity: 'medium', metrics: ['cart'] },

      // Products - single
      { id: 'shopping-007', prompt: 'A widget showing product of the day', complexity: 'medium', metrics: ['product'] },
      { id: 'shopping-008', prompt: 'A widget displaying product with price and rating', complexity: 'medium', metrics: ['product'] },
      { id: 'shopping-009', prompt: 'A widget showing product details', complexity: 'complex', metrics: ['product'] },
      { id: 'shopping-010', prompt: 'A widget displaying product image and name', complexity: 'simple', metrics: ['product'] },
      { id: 'shopping-011', prompt: 'A widget showing product reviews', complexity: 'medium', metrics: ['product'] },
      { id: 'shopping-012', prompt: 'A widget displaying product stock status', complexity: 'simple', metrics: ['product'] },
      { id: 'shopping-013', prompt: 'A widget showing product with add to cart button', complexity: 'medium', metrics: ['product'] },

      // Products - collections
      { id: 'shopping-014', prompt: 'A widget showing recommended products', complexity: 'complex', metrics: ['products'] },
      { id: 'shopping-015', prompt: 'A widget displaying recently viewed items', complexity: 'medium', metrics: ['products'] },
      { id: 'shopping-016', prompt: 'A widget showing trending products', complexity: 'complex', metrics: ['products'] },
      { id: 'shopping-017', prompt: 'A widget displaying new arrivals', complexity: 'medium', metrics: ['products'] },
      { id: 'shopping-018', prompt: 'A widget showing best sellers', complexity: 'complex', metrics: ['products'] },

      // Deals & Savings
      { id: 'shopping-019', prompt: 'A widget showing daily deals', complexity: 'medium', metrics: ['deals'] },
      { id: 'shopping-020', prompt: 'A widget displaying flash sale countdown', complexity: 'medium', metrics: ['sale'], visualization: ['countdown'] },
      { id: 'shopping-021', prompt: 'A widget showing price drop alerts', complexity: 'medium', metrics: ['deals'] },
      { id: 'shopping-022', prompt: 'A widget displaying discount coupons', complexity: 'medium', metrics: ['coupons'] },
      { id: 'shopping-023', prompt: 'A widget showing total savings', complexity: 'simple', metrics: ['savings'] },
      { id: 'shopping-024', prompt: 'A widget displaying clearance items', complexity: 'complex', metrics: ['products', 'sale'] },

      // Orders & Tracking
      { id: 'shopping-025', prompt: 'A widget showing recent orders', complexity: 'complex', metrics: ['orders'] },
      { id: 'shopping-026', prompt: 'A widget displaying order status', complexity: 'medium', metrics: ['order'] },
      { id: 'shopping-027', prompt: 'A widget showing package tracking', complexity: 'complex', metrics: ['tracking'], visualization: ['tracking'] },
      { id: 'shopping-028', prompt: 'A widget displaying delivery ETA', complexity: 'simple', metrics: ['delivery'] },
      { id: 'shopping-029', prompt: 'A widget showing order history', complexity: 'complex', metrics: ['orders'] },
      { id: 'shopping-030', prompt: 'A widget displaying order details', complexity: 'medium', metrics: ['order'] },

      // Wishlist & Saved
      { id: 'shopping-031', prompt: 'A widget showing wishlist items', complexity: 'complex', metrics: ['wishlist'] },
      { id: 'shopping-032', prompt: 'A widget displaying saved for later', complexity: 'medium', metrics: ['saved'] },
      { id: 'shopping-033', prompt: 'A widget showing favorites', complexity: 'medium', metrics: ['favorites'] },
      { id: 'shopping-034', prompt: 'A widget displaying wishlist price changes', complexity: 'medium', metrics: ['wishlist'] },

      // Spending & Budget
      { id: 'shopping-035', prompt: 'A widget showing monthly spending', complexity: 'medium', metrics: ['spending'], visualization: ['chart'] },
      { id: 'shopping-036', prompt: 'A widget displaying shopping budget', complexity: 'medium', metrics: ['budget'], visualization: ['progress'] },
      { id: 'shopping-037', prompt: 'A widget showing spending by category', complexity: 'complex', metrics: ['spending'], visualization: ['pie-chart'] },
      { id: 'shopping-038', prompt: 'A widget displaying total spent this month', complexity: 'simple', metrics: ['spending'] },

      // Loyalty & Rewards
      { id: 'shopping-039', prompt: 'A widget showing rewards points', complexity: 'simple', metrics: ['rewards'] },
      { id: 'shopping-040', prompt: 'A widget displaying loyalty status', complexity: 'medium', metrics: ['loyalty'] },
      { id: 'shopping-041', prompt: 'A widget showing cashback earned', complexity: 'simple', metrics: ['cashback'] },
      { id: 'shopping-042', prompt: 'A widget displaying membership benefits', complexity: 'medium', metrics: ['membership'] },

      // Price tracking
      { id: 'shopping-043', prompt: 'A widget showing price comparison', complexity: 'medium', metrics: ['prices'] },
      { id: 'shopping-044', prompt: 'A widget displaying price history', complexity: 'complex', metrics: ['price'], visualization: ['chart'] },
      { id: 'shopping-045', prompt: 'A widget showing lowest price alert', complexity: 'simple', metrics: ['price'] },

      // Lists & Organization
      { id: 'shopping-046', prompt: 'A widget showing shopping lists', complexity: 'medium', metrics: ['lists'] },
      { id: 'shopping-047', prompt: 'A widget displaying gift ideas list', complexity: 'medium', metrics: ['gifts'] },
      { id: 'shopping-048', prompt: 'A widget showing purchase reminders', complexity: 'medium', metrics: ['reminders'] },

      // Special features
      { id: 'shopping-049', prompt: 'A widget showing size guide', complexity: 'medium', metrics: ['guide'] },
      { id: 'shopping-050', prompt: 'A widget displaying return window', complexity: 'simple', metrics: ['returns'] },
    ]
  },

  social: {
    domain: 'social',
    descriptions: [
      // Feed & Posts
      { id: 'social-001', prompt: 'A widget showing latest post', complexity: 'medium', metrics: ['post'] },
      { id: 'social-002', prompt: 'A widget displaying recent posts', complexity: 'complex', metrics: ['posts'] },
      { id: 'social-003', prompt: 'A widget showing post with photo', complexity: 'medium', metrics: ['post'] },
      { id: 'social-004', prompt: 'A widget displaying post engagement', complexity: 'medium', metrics: ['post', 'engagement'] },
      { id: 'social-005', prompt: 'A widget showing trending posts', complexity: 'complex', metrics: ['posts'] },
      { id: 'social-006', prompt: 'A widget displaying friend\'s recent post', complexity: 'medium', metrics: ['post'] },

      // Engagement - likes
      { id: 'social-007', prompt: 'A widget showing post likes count', complexity: 'simple', metrics: ['likes'] },
      { id: 'social-008', prompt: 'A widget displaying likes received today', complexity: 'simple', metrics: ['likes'] },
      { id: 'social-009', prompt: 'A widget showing most liked posts', complexity: 'complex', metrics: ['posts', 'likes'] },
      { id: 'social-010', prompt: 'A widget displaying total likes this week', complexity: 'simple', metrics: ['likes'] },

      // Engagement - comments
      { id: 'social-011', prompt: 'A widget showing recent comments', complexity: 'medium', metrics: ['comments'] },
      { id: 'social-012', prompt: 'A widget displaying comment count', complexity: 'simple', metrics: ['comments'] },
      { id: 'social-013', prompt: 'A widget showing unread comments', complexity: 'medium', metrics: ['comments'] },

      // Engagement - shares
      { id: 'social-014', prompt: 'A widget showing share count', complexity: 'simple', metrics: ['shares'] },
      { id: 'social-015', prompt: 'A widget displaying viral posts', complexity: 'complex', metrics: ['posts', 'shares'] },

      // Profile stats
      { id: 'social-016', prompt: 'A widget showing profile statistics', complexity: 'medium', metrics: ['profile'] },
      { id: 'social-017', prompt: 'A widget displaying followers count', complexity: 'simple', metrics: ['followers'] },
      { id: 'social-018', prompt: 'A widget showing following count', complexity: 'simple', metrics: ['following'] },
      { id: 'social-019', prompt: 'A widget displaying posts count', complexity: 'simple', metrics: ['posts'] },
      { id: 'social-020', prompt: 'A widget showing follower growth', complexity: 'medium', metrics: ['followers'], visualization: ['chart'] },
      { id: 'social-021', prompt: 'A widget displaying profile views', complexity: 'simple', metrics: ['views'] },
      { id: 'social-022', prompt: 'A widget showing engagement rate', complexity: 'medium', metrics: ['engagement'], visualization: ['progress'] },

      // Stories
      { id: 'social-023', prompt: 'A widget showing active stories', complexity: 'medium', metrics: ['stories'] },
      { id: 'social-024', prompt: 'A widget displaying story views', complexity: 'simple', metrics: ['story', 'views'] },
      { id: 'social-025', prompt: 'A widget showing friends with new stories', complexity: 'complex', metrics: ['stories'] },
      { id: 'social-026', prompt: 'A widget displaying story highlights', complexity: 'medium', metrics: ['stories'] },

      // Messages & DMs
      { id: 'social-027', prompt: 'A widget showing unread messages', complexity: 'medium', metrics: ['messages'] },
      { id: 'social-028', prompt: 'A widget displaying recent DM', complexity: 'medium', metrics: ['messages'] },
      { id: 'social-029', prompt: 'A widget showing message count', complexity: 'simple', metrics: ['messages'] },
      { id: 'social-030', prompt: 'A widget displaying chat preview', complexity: 'medium', metrics: ['messages'] },

      // Followers & Following
      { id: 'social-031', prompt: 'A widget showing new followers', complexity: 'medium', metrics: ['followers'] },
      { id: 'social-032', prompt: 'A widget displaying suggested follows', complexity: 'complex', metrics: ['suggestions'] },
      { id: 'social-033', prompt: 'A widget showing mutual friends', complexity: 'medium', metrics: ['friends'] },
      { id: 'social-034', prompt: 'A widget displaying who to follow', complexity: 'complex', metrics: ['suggestions'] },
      { id: 'social-035', prompt: 'A widget showing follower milestones', complexity: 'medium', metrics: ['followers'] },

      // Notifications
      { id: 'social-036', prompt: 'A widget showing notifications', complexity: 'medium', metrics: ['notifications'] },
      { id: 'social-037', prompt: 'A widget displaying unread notifications count', complexity: 'simple', metrics: ['notifications'] },
      { id: 'social-038', prompt: 'A widget showing recent activity', complexity: 'complex', metrics: ['activity'] },
      { id: 'social-039', prompt: 'A widget displaying mentions', complexity: 'medium', metrics: ['mentions'] },
      { id: 'social-040', prompt: 'A widget showing tagged posts', complexity: 'complex', metrics: ['tags'] },

      // Content creation
      { id: 'social-041', prompt: 'A widget showing post performance', complexity: 'complex', metrics: ['post', 'analytics'], visualization: ['chart'] },
      { id: 'social-042', prompt: 'A widget displaying best time to post', complexity: 'medium', metrics: ['analytics'] },
      { id: 'social-043', prompt: 'A widget showing content calendar', complexity: 'complex', metrics: ['calendar'] },
      { id: 'social-044', prompt: 'A widget displaying post drafts', complexity: 'medium', metrics: ['drafts'] },

      // Analytics
      { id: 'social-045', prompt: 'A widget showing weekly engagement', complexity: 'complex', metrics: ['engagement'], visualization: ['chart'] },
      { id: 'social-046', prompt: 'A widget displaying reach metrics', complexity: 'medium', metrics: ['reach'] },
      { id: 'social-047', prompt: 'A widget showing impressions', complexity: 'simple', metrics: ['impressions'] },
      { id: 'social-048', prompt: 'A widget displaying audience demographics', complexity: 'complex', metrics: ['audience'], visualization: ['pie-chart'] },

      // Special features
      { id: 'social-049', prompt: 'A widget showing trending hashtags', complexity: 'medium', metrics: ['hashtags'] },
      { id: 'social-050', prompt: 'A widget displaying saved posts', complexity: 'complex', metrics: ['saved'] },
      { id: 'social-051', prompt: 'A widget showing collections', complexity: 'medium', metrics: ['collections'] },
      { id: 'social-052', prompt: 'A widget displaying profile completion', complexity: 'medium', metrics: ['profile'], visualization: ['progress'] },
      { id: 'social-053', prompt: 'A widget showing streak count', complexity: 'simple', metrics: ['streak'] },
      { id: 'social-054', prompt: 'A widget displaying verified badge status', complexity: 'simple', metrics: ['verified'] },
      { id: 'social-055', prompt: 'A widget showing friends online now', complexity: 'medium', metrics: ['friends', 'online'] },
    ]
  }
};

/**
 * Generate and save description libraries
 */
function generateDescriptionLibraries(domainsToProcess = null) {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating description libraries...\n');

  const domains = domainsToProcess || Object.keys(descriptionLibrary);

  if (domainsToProcess) {
    console.log(`Domains to process: ${domains.join(', ')}\n`);
  }

  let totalDescriptions = 0;

  domains.forEach(domain => {
    if (!descriptionLibrary[domain]) {
      console.warn(`⚠️  Domain '${domain}' not found in description library`);
      return;
    }

    const library = descriptionLibrary[domain];
    const count = library.descriptions.length;
    totalDescriptions += count;

    // Save to JSON file
    const outputPath = path.join(OUTPUT_DIR, `${domain}-descriptions.json`);
    fs.writeFileSync(outputPath, JSON.stringify(library, null, 2), 'utf-8');

    console.log(`✓ ${domain.padEnd(15)} ${count.toString().padStart(3)} descriptions → ${path.basename(outputPath)}`);
  });

  console.log(`\n✅ Generated ${totalDescriptions} total descriptions across ${domains.length} domains`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let domains = null;

  args.forEach(arg => {
    if (arg.startsWith('--domains=')) {
      domains = arg.split('=')[1].split(',');
    }
  });

  return { domains };
}

// Run the generator
const { domains } = parseArgs();
generateDescriptionLibraries(domains);
