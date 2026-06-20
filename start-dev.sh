#!/bin/bash

echo "🚀 Starting MedMate with AI Failover..."
echo ""
echo "📋 Configuration:"
echo "   • App Rate Limit: 100 req/min (increased from 12)"
echo "   • Gemini Models: 5 models in rotation"
echo "   • OpenRouter Fallback: 4 free models"
echo "   • Pre-exhausted: gemini-2.5-flash (RPD 27/20)"
echo ""
echo "🔍 Watch for these logs:"
echo "   [Quota Init] Pre-marked gemini-2.5-flash as exhausted"
echo "   [AI Router] Resolved candidates for \"summary\""
echo "   [AI Router Stream] ⏩ Skipping gemini/gemini-2.5-flash (quota exhausted)"
echo "   [AI Router Stream] Attempting gemini/gemini-3.1-flash-lite"
echo "   [AI Router Stream] ✅ Success with gemini/gemini-3.1-flash-lite"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
