export class ModelResolver {
  constructor() {
    this.cache = new Map(); // key -> { model, expiresAt }
  }

  async resolveModel(apiUrl, apiKey, configuredModel, force = false) {
    if (!apiUrl || !apiKey) return configuredModel;
    
    const cacheKey = `${apiUrl}:${apiKey}`;
    if (!force && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() < cached.expiresAt) {
        return cached.model;
      }
    }

    let modelsUrl = apiUrl.replace(/\/chat\/completions\/?$/, '/models');
    if (modelsUrl === apiUrl) {
      this.cache.set(cacheKey, { model: configuredModel, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
      let aiHost = apiUrl;
      try { aiHost = new URL(apiUrl).host; } catch (err) {}
      console.info(`AI provider: ${aiHost}`);
      console.info(`AI model: ${configuredModel} (from env)`);
      return configuredModel;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.cache.set(cacheKey, { model: configuredModel, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
        let aiHost = apiUrl;
        try { aiHost = new URL(apiUrl).host; } catch (err) {}
        console.info(`AI provider: ${aiHost}`);
        console.info(`AI model: ${configuredModel} (from env)`);
        return configuredModel; 
      }

      const data = await res.json();
      if (!data.data || !Array.isArray(data.data)) {
        this.cache.set(cacheKey, { model: configuredModel, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
        let aiHost = apiUrl;
        try { aiHost = new URL(apiUrl).host; } catch (err) {}
        console.info(`AI provider: ${aiHost}`);
        console.info(`AI model: ${configuredModel} (from env)`);
        return configuredModel;
      }

      const allModels = data.data.map(m => m.id);
      
      const isExcluded = (id) => {
        const lower = id.toLowerCase();
        return lower.includes('whisper') || lower.includes('tts') || lower.includes('guard') || 
               lower.includes('embed') || lower.includes('moderation') || lower.includes('audio') ||
               lower.includes('vision');
      };

      const chatModels = allModels.filter(id => !isExcluded(id));
      if (chatModels.length === 0) {
        this.cache.set(cacheKey, { model: configuredModel, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
        let aiHost = apiUrl;
        try { aiHost = new URL(apiUrl).host; } catch (err) {}
        console.info(`AI provider: ${aiHost}`);
        console.info(`AI model: ${configuredModel} (from env)`);
        return configuredModel;
      }

      // Rank models
      const rankScore = (id) => {
        if (id === configuredModel) return 100;
        const lower = id.toLowerCase();
        let score = 0;
        if (lower.includes('instant')) score += 10;
        if (lower.includes('8b')) score += 10;
        if (lower.includes('mini')) score += 10;
        if (lower.includes('flash')) score += 10;
        if (lower.includes('small')) score += 10;
        return score;
      };

      chatModels.sort((a, b) => rankScore(b) - rankScore(a));
      const candidates = chatModels.slice(0, 3);

      for (const candidate of candidates) {
        const testRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: candidate,
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 5,
            stream: false
          })
        });

        if (testRes.ok) {
          const testData = await testRes.json();
          if (testData.choices && testData.choices.length > 0) {
            this.cache.set(cacheKey, { model: candidate, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
            console.info(`AI provider: ${new URL(apiUrl).host}`);
            console.info(`AI model: ${candidate} (auto-selected)`);
            return candidate;
          }
        }
      }
      
      this.cache.set(cacheKey, { model: configuredModel, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
      console.info(`AI provider: ${new URL(apiUrl).host}`);
      console.info(`AI model: ${configuredModel} (from env)`);
      return configuredModel;
    } catch (e) {
      this.cache.set(cacheKey, { model: configuredModel, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
      let aiHost = apiUrl;
      try { aiHost = new URL(apiUrl).host; } catch (err) {}
      console.info(`AI provider: ${aiHost}`);
      console.info(`AI model: ${configuredModel} (from env)`);
      return configuredModel;
    }
  }
}

export const modelResolver = new ModelResolver();
