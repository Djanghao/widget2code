import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../data/descriptions/dynamic');

/**
 * Dynamic variation templates for each domain
 * These templates can be combined to create unlimited variations
 */
const variationTemplates = {
  health: {
    domain: 'health',

    // Core metrics that can be displayed
    metrics: [
      'heart rate',
      'steps',
      'calories',
      'sleep',
      'water intake',
      'weight',
      'blood pressure',
      'exercise time',
      'stand hours',
      'distance walked',
      'active energy',
      'resting energy',
      'mindfulness minutes',
      'vo2 max',
    ],

    // Visualization types
    visualizations: [
      'with a trend sparkline',
      'with a line chart',
      'with a bar chart',
      'with a progress ring',
      'with a progress bar',
      'with activity rings',
      'with a pie chart',
      'with a weekly trend',
      'with a monthly view',
      'with percentage display',
    ],

    // Layout styles
    layouts: [
      'A compact widget',
      'A detailed widget',
      'A minimal widget',
      'A dashboard widget',
      'A large widget',
      'A small widget',
    ],

    // Additional modifiers
    modifiers: [
      'and goal comparison',
      'and time remaining',
      'and weekly average',
      'and personal record',
      'and today vs yesterday',
      'and percentage change',
    ],

    // Combine up to N metrics
    multiMetricCombinations: [
      ['heart rate', 'steps'],
      ['calories', 'exercise time'],
      ['steps', 'distance walked'],
      ['heart rate', 'calories', 'steps'],
      ['sleep', 'mindfulness minutes'],
      ['water intake', 'steps', 'calories'],
      ['weight', 'active energy'],
    ],
  },

  finance: {
    domain: 'finance',

    metrics: [
      'stock price',
      'portfolio value',
      'Bitcoin price',
      'Ethereum price',
      'account balance',
      'net worth',
      'spending',
      'budget',
      'savings',
      'investment returns',
      'dividend income',
      'transaction history',
    ],

    visualizations: [
      'with price chart',
      'with trend sparkline',
      'with percent change',
      'with daily performance',
      'with volume bars',
      'with candlestick chart',
      'with pie chart breakdown',
      'with bar graph',
    ],

    layouts: [
      'A compact widget',
      'A detailed widget',
      'A watchlist widget',
      'A portfolio widget',
      'A minimal widget',
    ],

    modifiers: [
      'and 24h change',
      'and market cap',
      'and P/E ratio',
      'and dividend yield',
      'and vs target',
      'and YTD performance',
    ],

    multiMetricCombinations: [
      ['stock price', 'volume'],
      ['Bitcoin price', 'Ethereum price'],
      ['portfolio value', 'daily change'],
      ['spending', 'budget'],
      ['account balance', 'recent transactions'],
    ],

    // Stock-specific
    stockSymbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA'],
  },

  weather: {
    domain: 'weather',

    metrics: [
      'temperature',
      'feels like temperature',
      'humidity',
      'wind speed',
      'UV index',
      'air quality',
      'precipitation',
      'visibility',
      'pressure',
      'sunrise time',
      'sunset time',
    ],

    visualizations: [
      'with hourly forecast',
      'with 5-day forecast',
      'with radar map',
      'with temperature chart',
      'with condition icons',
      'with weekly view',
    ],

    layouts: [
      'A compact weather widget',
      'A detailed weather widget',
      'A minimal weather widget',
      'A forecast widget',
    ],

    modifiers: [
      'and high/low temps',
      'and weather alerts',
      'and pollen count',
      'and moon phase',
    ],

    multiMetricCombinations: [
      ['temperature', 'feels like temperature'],
      ['temperature', 'humidity', 'wind speed'],
      ['UV index', 'air quality'],
      ['sunrise time', 'sunset time'],
    ],

    timeframes: ['current', 'today', 'this week', 'hourly', 'daily'],
  },

  productivity: {
    domain: 'productivity',

    metrics: [
      'tasks',
      'calendar events',
      'reminders',
      'notes',
      'focus time',
      'pomodoro sessions',
      'completed tasks',
      'overdue items',
      'upcoming deadlines',
      'time tracked',
    ],

    visualizations: [
      'with progress bar',
      'with completion percentage',
      'with time breakdown',
      'with weekly summary',
      'with calendar view',
    ],

    layouts: [
      'A task widget',
      'A calendar widget',
      'A productivity widget',
      'A summary widget',
    ],

    modifiers: [
      'and completion status',
      'and due dates',
      'and priority indicators',
      'and time estimates',
    ],

    multiMetricCombinations: [
      ['tasks', 'calendar events'],
      ['focus time', 'completed tasks'],
      ['tasks', 'reminders'],
      ['calendar events', 'upcoming deadlines'],
    ],

    timeframes: ['today', 'this week', 'upcoming', 'overdue'],
  },

  media: {
    domain: 'media',

    metrics: [
      'now playing song',
      'current podcast',
      'playlist',
      'recently played',
      'favorite artists',
      'album',
      'video',
      'photos',
    ],

    visualizations: [
      'with album art',
      'with playback controls',
      'with progress bar',
      'with scrubber',
      'with volume control',
      'with photo grid',
    ],

    layouts: [
      'A music widget',
      'A podcast widget',
      'A media player widget',
      'A compact player widget',
    ],

    modifiers: [
      'and time remaining',
      'and play/pause button',
      'and skip controls',
      'and artist info',
      'and episode details',
    ],

    multiMetricCombinations: [
      ['now playing song', 'playlist'],
      ['current podcast', 'playback position'],
      ['album', 'track list'],
    ],
  },

  communication: {
    domain: 'communication',

    metrics: [
      'messages',
      'emails',
      'calls',
      'notifications',
      'contacts',
      'unread count',
      'missed calls',
      'voicemails',
    ],

    visualizations: [
      'with avatars',
      'with message preview',
      'with contact photos',
      'with badge counts',
      'with timestamp',
    ],

    layouts: [
      'A messages widget',
      'An email widget',
      'A calls widget',
      'A notifications widget',
    ],

    modifiers: [
      'and sender names',
      'and read status',
      'and reply button',
      'and quick actions',
    ],

    multiMetricCombinations: [
      ['messages', 'calls'],
      ['emails', 'notifications'],
      ['messages', 'unread count'],
    ],

    timeframes: ['recent', 'unread', 'today', 'this week'],
  },

  'smart-home': {
    domain: 'smart-home',

    metrics: [
      'thermostat temperature',
      'lights status',
      'security system',
      'door locks',
      'cameras',
      'energy usage',
      'room temperature',
      'humidity level',
      'air quality',
      'window blinds',
    ],

    visualizations: [
      'with controls',
      'with on/off toggle',
      'with temperature slider',
      'with brightness slider',
      'with camera feed',
      'with usage chart',
    ],

    layouts: [
      'A climate widget',
      'A security widget',
      'A lights widget',
      'A room widget',
      'A home overview widget',
    ],

    modifiers: [
      'and control buttons',
      'and auto mode indicator',
      'and schedule',
      'and energy cost',
    ],

    multiMetricCombinations: [
      ['thermostat temperature', 'humidity level'],
      ['lights status', 'energy usage'],
      ['security system', 'door locks'],
      ['room temperature', 'thermostat temperature'],
    ],

    rooms: ['living room', 'bedroom', 'kitchen', 'office', 'whole home'],
  },

  navigation: {
    domain: 'navigation',

    metrics: [
      'current location',
      'next turn',
      'ETA',
      'distance remaining',
      'traffic conditions',
      'speed',
      'route overview',
      'saved locations',
      'nearby places',
      'parking location',
    ],

    visualizations: [
      'with map view',
      'with route line',
      'with turn-by-turn',
      'with traffic overlay',
      'with POI markers',
    ],

    layouts: [
      'A navigation widget',
      'A traffic widget',
      'A location widget',
      'A directions widget',
    ],

    modifiers: [
      'and arrival time',
      'and alternate routes',
      'and traffic delays',
      'and distance',
    ],

    multiMetricCombinations: [
      ['next turn', 'ETA'],
      ['current location', 'parking location'],
      ['ETA', 'traffic conditions'],
      ['distance remaining', 'arrival time'],
    ],

    destinations: ['to home', 'to work', 'to destination', 'from work'],
  },

  utilities: {
    domain: 'utilities',

    metrics: [
      'battery level',
      'storage space',
      'WiFi status',
      'network speed',
      'CPU usage',
      'memory usage',
      'data usage',
      'screen time',
      'charging status',
    ],

    visualizations: [
      'with percentage',
      'with progress ring',
      'with progress bar',
      'with usage graph',
      'with icon indicator',
    ],

    layouts: [
      'A battery widget',
      'A storage widget',
      'A system widget',
      'A network widget',
    ],

    modifiers: [
      'and time remaining',
      'and available space',
      'and signal strength',
      'and charging rate',
    ],

    multiMetricCombinations: [
      ['battery level', 'charging status'],
      ['storage space', 'available space'],
      ['WiFi status', 'network speed'],
      ['CPU usage', 'memory usage'],
    ],
  },

  sports: {
    domain: 'sports',

    metrics: [
      'live score',
      'game clock',
      'team standings',
      'player stats',
      'upcoming games',
      'recent results',
      'league table',
      'fantasy points',
      'match events',
    ],

    visualizations: [
      'with team logos',
      'with score display',
      'with standings table',
      'with stats bars',
      'with timeline',
    ],

    layouts: [
      'A scoreboard widget',
      'A standings widget',
      'A schedule widget',
      'A live game widget',
    ],

    modifiers: [
      'and game status',
      'and quarter/period',
      'and win/loss record',
      'and next game',
    ],

    multiMetricCombinations: [
      ['live score', 'game clock'],
      ['team standings', 'recent results'],
      ['player stats', 'fantasy points'],
    ],

    sports: ['football', 'basketball', 'baseball', 'soccer', 'hockey'],
  },

  travel: {
    domain: 'travel',

    metrics: [
      'flight details',
      'flight status',
      'boarding pass',
      'hotel reservation',
      'trip itinerary',
      'destination info',
      'booking confirmation',
      'luggage tracking',
      'airport terminal',
      'travel expenses',
      'trip countdown',
      'check-in time',
      'rental car',
      'train schedule',
      'attractions',
    ],

    visualizations: [
      'with flight route',
      'with countdown timer',
      'with map view',
      'with expense chart',
      'with timeline',
      'with barcode',
      'with booking details',
      'with photo',
      'with weather',
      'with directions',
    ],

    layouts: [
      'A flight widget',
      'A hotel widget',
      'A trip widget',
      'A travel widget',
      'A booking widget',
      'A compact travel widget',
    ],

    modifiers: [
      'and gate information',
      'and departure time',
      'and destination weather',
      'and confirmation number',
      'and packing checklist',
      'and loyalty points',
    ],

    multiMetricCombinations: [
      ['flight details', 'boarding pass'],
      ['hotel reservation', 'check-in time'],
      ['trip itinerary', 'travel expenses'],
      ['destination info', 'attractions'],
      ['flight status', 'gate information'],
    ],

    destinations: ['New York', 'London', 'Tokyo', 'Paris', 'Dubai'],
  },

  food: {
    domain: 'food',

    metrics: [
      'recipe details',
      'cooking instructions',
      'restaurant info',
      'nutrition facts',
      'meal plan',
      'grocery list',
      'delivery order',
      'calories',
      'ingredients',
      'cooking time',
      'restaurant rating',
      'recipe rating',
      'macro nutrients',
      'water intake',
      'meal history',
    ],

    visualizations: [
      'with recipe photo',
      'with nutrition chart',
      'with ingredients list',
      'with step-by-step guide',
      'with rating stars',
      'with calorie progress',
      'with macro breakdown',
      'with cooking timer',
      'with delivery tracking',
      'with restaurant map',
    ],

    layouts: [
      'A recipe widget',
      'A restaurant widget',
      'A nutrition widget',
      'A meal plan widget',
      'A food widget',
      'A delivery widget',
    ],

    modifiers: [
      'and prep time',
      'and servings count',
      'and dietary tags',
      'and price range',
      'and reviews',
      'and delivery ETA',
    ],

    multiMetricCombinations: [
      ['recipe details', 'cooking time'],
      ['restaurant info', 'rating'],
      ['nutrition facts', 'calories'],
      ['meal plan', 'grocery list'],
      ['delivery order', 'tracking'],
    ],

    cuisines: ['Italian', 'Japanese', 'Mexican', 'Chinese', 'Thai'],
  },

  shopping: {
    domain: 'shopping',

    metrics: [
      'shopping cart',
      'product details',
      'order status',
      'delivery tracking',
      'wishlist',
      'price',
      'deals',
      'rewards points',
      'order history',
      'product reviews',
      'savings',
      'spending',
      'budget',
      'flash sale',
      'recommendations',
    ],

    visualizations: [
      'with product photo',
      'with price comparison',
      'with rating stars',
      'with tracking timeline',
      'with savings meter',
      'with cart summary',
      'with countdown timer',
      'with spending chart',
      'with review snippets',
      'with stock indicator',
    ],

    layouts: [
      'A product widget',
      'A cart widget',
      'A order widget',
      'A deals widget',
      'A shopping widget',
      'A wishlist widget',
    ],

    modifiers: [
      'and add to cart button',
      'and delivery date',
      'and price drop alert',
      'and stock status',
      'and discount badge',
      'and loyalty rewards',
    ],

    multiMetricCombinations: [
      ['shopping cart', 'total price'],
      ['product details', 'reviews'],
      ['order status', 'delivery tracking'],
      ['wishlist', 'price alerts'],
      ['deals', 'savings'],
    ],

    categories: ['Electronics', 'Fashion', 'Home', 'Beauty', 'Books'],
  },

  social: {
    domain: 'social',

    metrics: [
      'latest post',
      'followers count',
      'following count',
      'post likes',
      'comments',
      'story views',
      'messages',
      'notifications',
      'engagement rate',
      'profile stats',
      'trending posts',
      'mentions',
      'shares',
      'saved posts',
      'reach',
    ],

    visualizations: [
      'with profile photo',
      'with engagement chart',
      'with follower growth',
      'with post preview',
      'with story ring',
      'with analytics graph',
      'with notification badges',
      'with trending indicators',
      'with demographics pie chart',
      'with time series',
    ],

    layouts: [
      'A post widget',
      'A profile widget',
      'A story widget',
      'A social widget',
      'A feed widget',
      'An analytics widget',
    ],

    modifiers: [
      'and post timestamp',
      'and verified badge',
      'and engagement metrics',
      'and follow button',
      'and share count',
      'and growth percentage',
    ],

    multiMetricCombinations: [
      ['latest post', 'likes'],
      ['followers count', 'following count'],
      ['story views', 'reach'],
      ['engagement rate', 'post likes'],
      ['notifications', 'messages'],
    ],

    platforms: ['Instagram', 'Twitter', 'Facebook', 'LinkedIn', 'TikTok'],
  },
};

/**
 * Generate variations for a domain
 */
function generateVariations(domainTemplate, count = 100) {
  const variations = [];
  const { domain, metrics, visualizations, layouts, modifiers, multiMetricCombinations } = domainTemplate;

  let id = 1;

  // Single metric variations
  for (let i = 0; i < Math.min(count / 2, metrics.length * 3); i++) {
    const layout = layouts[Math.floor(Math.random() * layouts.length)];
    const metric = metrics[Math.floor(Math.random() * metrics.length)];

    // 50% chance to add visualization
    const addVisualization = Math.random() > 0.5;
    const visualization = addVisualization ? visualizations[Math.floor(Math.random() * visualizations.length)] : '';

    // 30% chance to add modifier
    const addModifier = Math.random() > 0.7;
    const modifier = addModifier ? modifiers[Math.floor(Math.random() * modifiers.length)] : '';

    let prompt = `${layout} showing ${metric}`;
    if (visualization) prompt += ` ${visualization}`;
    if (modifier) prompt += ` ${modifier}`;

    const complexity = visualization && modifier ? 'complex' : (visualization || modifier ? 'medium' : 'simple');

    variations.push({
      id: `${domain}-dynamic-${String(id++).padStart(3, '0')}`,
      prompt,
      complexity,
      generated: true,
    });
  }

  // Multi-metric combinations
  if (multiMetricCombinations) {
    for (const combination of multiMetricCombinations) {
      const layout = layouts[Math.floor(Math.random() * layouts.length)];
      const metricsText = combination.join(', ').replace(/, ([^,]*)$/, ' and $1'); // Join with "and" for last item

      const addVisualization = Math.random() > 0.5;
      const visualization = addVisualization ? visualizations[Math.floor(Math.random() * visualizations.length)] : '';

      let prompt = `${layout} showing ${metricsText}`;
      if (visualization) prompt += ` ${visualization}`;

      variations.push({
        id: `${domain}-dynamic-${String(id++).padStart(3, '0')}`,
        prompt,
        complexity: 'complex',
        generated: true,
      });
    }
  }

  // Domain-specific variations
  if (domain === 'finance' && domainTemplate.stockSymbols) {
    for (const symbol of domainTemplate.stockSymbols.slice(0, 3)) {
      const viz = visualizations[Math.floor(Math.random() * visualizations.length)];
      variations.push({
        id: `${domain}-dynamic-${String(id++).padStart(3, '0')}`,
        prompt: `A stock widget showing ${symbol} ${viz}`,
        complexity: 'medium',
        generated: true,
      });
    }
  }

  if (domain === 'weather' && domainTemplate.timeframes) {
    for (const timeframe of domainTemplate.timeframes) {
      variations.push({
        id: `${domain}-dynamic-${String(id++).padStart(3, '0')}`,
        prompt: `A weather widget showing ${timeframe} conditions with forecast`,
        complexity: 'medium',
        generated: true,
      });
    }
  }

  if (domain === 'smart-home' && domainTemplate.rooms) {
    for (const room of domainTemplate.rooms.slice(0, 3)) {
      variations.push({
        id: `${domain}-dynamic-${String(id++).padStart(3, '0')}`,
        prompt: `A smart home widget showing ${room} status with controls`,
        complexity: 'complex',
        generated: true,
      });
    }
  }

  return variations.slice(0, count);
}

/**
 * Generate dynamic variations for all domains
 */
function generateAllDynamicVariations(variationsPerDomain = 100) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Generating ${variationsPerDomain} dynamic variations per domain...\n`);

  let totalVariations = 0;

  Object.keys(variationTemplates).forEach(domain => {
    const template = variationTemplates[domain];
    const variations = generateVariations(template, variationsPerDomain);

    const output = {
      domain,
      total: variations.length,
      generated: new Date().toISOString(),
      variations,
    };

    const outputPath = path.join(OUTPUT_DIR, `${domain}-dynamic.json`);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    totalVariations += variations.length;
    console.log(`✓ ${domain.padEnd(15)} ${variations.length.toString().padStart(3)} variations → ${path.basename(outputPath)}`);
  });

  console.log(`\n✅ Generated ${totalVariations} total dynamic variations across ${Object.keys(variationTemplates).length} domains`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const countArg = args.find(arg => arg.startsWith('--count='));
const count = countArg ? parseInt(countArg.split('=')[1]) : 100;

// Run the generator
generateAllDynamicVariations(count);
