import { JournalEntry, Mood } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  Link as LinkIcon,
  Users,
  Map,
  Search,
  Tag,
  Rocket,
  Sparkles,
  Lightbulb,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isAfter, isBefore, isEqual, parseISO } from "date-fns";

interface CorrelationsProps {
  entries: JournalEntry[];
  moods: Mood[];
  isLoading?: boolean;
  className?: string;
}

export function Correlations({ entries, moods, isLoading, className }: CorrelationsProps) {
  // Filter to user-created entries only
  const userEntries = entries.filter(e => !e.isAiResponse);
  
  // Extract entity correlations
  const extractEntityCorrelations = () => {
    if (userEntries.length < 3) return [];
    
    // Track mentions of people, activities, and places
    const entityMap: Record<string, {
      name: string,
      type: 'person' | 'activity' | 'place',
      mentions: number,
      sentimentScores: number[],
      dates: Date[]
    }> = {};
    
    // Extract entities from themes
    userEntries.forEach(entry => {
      if (!entry.sentiment?.themes) return;
      
      const themes = entry.sentiment.themes;
      const date = new Date(entry.date);
      const sentimentScore = entry.sentiment.score || 0;
      
      // Look for people
      const peopleThemes = themes.filter(theme => 
        theme.includes("friend") ||
        theme.includes("family") ||
        theme.includes("partner") ||
        theme.includes("coworker") ||
        theme.includes("colleague") ||
        theme.includes("boss") || 
        theme.includes("spouse") ||
        theme.includes("relationship") ||
        theme.includes("mom") ||
        theme.includes("dad") ||
        theme.includes("sister") ||
        theme.includes("brother")
      );
      
      peopleThemes.forEach(theme => {
        if (!entityMap[theme]) {
          entityMap[theme] = {
            name: theme,
            type: 'person',
            mentions: 0,
            sentimentScores: [],
            dates: []
          };
        }
        
        entityMap[theme].mentions++;
        entityMap[theme].sentimentScores.push(sentimentScore);
        entityMap[theme].dates.push(date);
      });
      
      // Look for activities
      const activityThemes = themes.filter(theme => 
        theme.includes("work") ||
        theme.includes("exercise") ||
        theme.includes("hobby") ||
        theme.includes("reading") ||
        theme.includes("writing") ||
        theme.includes("meditation") ||
        theme.includes("yoga") ||
        theme.includes("run") ||
        theme.includes("walk") ||
        theme.includes("hiking") ||
        theme.includes("cooking") ||
        theme.includes("gaming") ||
        theme.includes("project") ||
        theme.includes("study") ||
        theme.includes("class")
      );
      
      activityThemes.forEach(theme => {
        if (!entityMap[theme]) {
          entityMap[theme] = {
            name: theme,
            type: 'activity',
            mentions: 0,
            sentimentScores: [],
            dates: []
          };
        }
        
        entityMap[theme].mentions++;
        entityMap[theme].sentimentScores.push(sentimentScore);
        entityMap[theme].dates.push(date);
      });
      
      // Look for places
      const placeThemes = themes.filter(theme => 
        theme.includes("home") ||
        theme.includes("office") ||
        theme.includes("work") ||
        theme.includes("gym") ||
        theme.includes("park") ||
        theme.includes("school") ||
        theme.includes("university") ||
        theme.includes("cafe") ||
        theme.includes("restaurant") ||
        theme.includes("travel") ||
        theme.includes("vacation") ||
        theme.includes("trip")
      );
      
      placeThemes.forEach(theme => {
        if (!entityMap[theme]) {
          entityMap[theme] = {
            name: theme,
            type: 'place',
            mentions: 0,
            sentimentScores: [],
            dates: []
          };
        }
        
        entityMap[theme].mentions++;
        entityMap[theme].sentimentScores.push(sentimentScore);
        entityMap[theme].dates.push(date);
      });
    });
    
    // Calculate average sentiment for each entity
    const entities = Object.values(entityMap)
      .filter(entity => entity.mentions >= 2)
      .map(entity => ({
        ...entity,
        avgSentiment: entity.sentimentScores.reduce((sum, score) => sum + score, 0) / entity.sentimentScores.length
      }))
      .sort((a, b) => b.mentions - a.mentions);
    
    return entities.slice(0, 10); // Return top 10 entities
  };
  
  // Find correlations between journaling frequency and sentiment
  const analyzeJournalingFrequencyCorrelation = () => {
    if (userEntries.length < 5) return null;
    
    // Group entries by week
    const entriesByWeek: Record<string, { entries: JournalEntry[], avgSentiment: number }> = {};
    
    userEntries.forEach(entry => {
      const date = new Date(entry.date);
      // Get week number as YYYY-WW
      const weekNumber = format(date, 'yyyy-ww');
      
      if (!entriesByWeek[weekNumber]) {
        entriesByWeek[weekNumber] = { entries: [], avgSentiment: 0 };
      }
      
      entriesByWeek[weekNumber].entries.push(entry);
    });
    
    // Calculate average sentiment for each week
    Object.values(entriesByWeek).forEach(week => {
      const sentimentScores = week.entries
        .filter(entry => entry.sentiment?.score !== undefined)
        .map(entry => entry.sentiment!.score);
      
      if (sentimentScores.length > 0) {
        week.avgSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
      }
    });
    
    // Calculate correlation between entry count and sentiment
    const weeks = Object.values(entriesByWeek);
    const entryCounts = weeks.map(week => week.entries.length);
    const sentiments = weeks.map(week => week.avgSentiment);
    
    // Calculate correlation coefficient (requires at least 3 weeks of data)
    if (weeks.length >= 3) {
      const highFrequencyWeeks = weeks.filter(week => week.entries.length >= 3);
      const lowFrequencyWeeks = weeks.filter(week => week.entries.length < 3);
      
      if (highFrequencyWeeks.length > 0 && lowFrequencyWeeks.length > 0) {
        const highFreqAvgSentiment = highFrequencyWeeks.reduce((sum, week) => sum + week.avgSentiment, 0) / highFrequencyWeeks.length;
        const lowFreqAvgSentiment = lowFrequencyWeeks.reduce((sum, week) => sum + week.avgSentiment, 0) / lowFrequencyWeeks.length;
        
        if (highFreqAvgSentiment > lowFreqAvgSentiment + 0.1) {
          return {
            type: "positive",
            text: "Weeks when you journal more frequently tend to have more positive emotions.",
            difference: ((highFreqAvgSentiment - lowFreqAvgSentiment) * 100).toFixed(0)
          };
        } else if (lowFreqAvgSentiment > highFreqAvgSentiment + 0.1) {
          return {
            type: "negative",
            text: "You seem to write more on weeks when you're experiencing challenging emotions.",
            difference: ((lowFreqAvgSentiment - highFreqAvgSentiment) * 100).toFixed(0)
          };
        } else {
          return {
            type: "neutral",
            text: "There's no strong connection between how often you journal and your emotional state.",
            difference: "0"
          };
        }
      }
    }
    
    return null;
  };
  
  // Find themes that correlate with higher or lower mood
  const findThemeCorrelations = () => {
    if (userEntries.length < 5 || !moods || moods.length < 5) return [];
    
    // Map moods to their respective dates for quick lookup
    const moodsByDate: Record<string, number> = {};
    moods.forEach(mood => {
      const dateStr = new Date(mood.date).toISOString().split('T')[0];
      moodsByDate[dateStr] = mood.rating;
    });
    
    // Track themes and their associated moods
    const themeToMoods: Record<string, number[]> = {};
    
    userEntries.forEach(entry => {
      if (!entry.sentiment?.themes) return;
      
      const dateStr = new Date(entry.date).toISOString().split('T')[0];
      // Also check one day after the entry for mood impact
      const nextDayDate = new Date(entry.date);
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      const nextDayStr = nextDayDate.toISOString().split('T')[0];
      
      const moodRating = moodsByDate[dateStr] || moodsByDate[nextDayStr];
      if (!moodRating) return;
      
      entry.sentiment.themes.forEach(theme => {
        if (!themeToMoods[theme]) {
          themeToMoods[theme] = [];
        }
        themeToMoods[theme].push(moodRating);
      });
    });
    
    // Calculate average mood for each theme with at least 2 occurrences
    const themeCorrelations = Object.entries(themeToMoods)
      .filter(([_, moods]) => moods.length >= 2)
      .map(([theme, moods]) => {
        const avgMood = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;
        
        // Calculate overall average mood for comparison
        const overallAvgMood = Object.values(moodsByDate).reduce((sum, mood) => sum + mood, 0) / Object.values(moodsByDate).length;
        
        return {
          theme,
          avgMood,
          difference: avgMood - overallAvgMood,
          entries: moods.length
        };
      })
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    
    // Return themes with significant mood differences
    return themeCorrelations
      .filter(theme => Math.abs(theme.difference) >= 0.5)
      .slice(0, 6);
  };
  
  const entities = extractEntityCorrelations();
  const frequencyCorrelation = analyzeJournalingFrequencyCorrelation();
  const themeCorrelations = findThemeCorrelations();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-[#F5B8DB] border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <h3 className="text-xl font-bold mb-4 font-['Montserrat_Variable']">Correlations & Insights</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {entities.length > 0 && (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Montserrat_Variable']">
                <LinkIcon className="h-5 w-5 text-[#B6CAEB]" />
                Common Topics & Emotional Impact
              </CardTitle>
              <CardDescription>
                How different aspects of your life affect your emotions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {/* People */}
                {entities.filter(e => e.type === 'person').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                      <Users className="h-4 w-4 text-[#F5B8DB]" />
                      People & Relationships
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {entities
                        .filter(e => e.type === 'person')
                        .map(entity => (
                          <Badge 
                            key={entity.name}
                            variant="outline"
                            className={`px-3 py-1.5 border-l-4 ${
                              entity.avgSentiment > 0.6 ? 'border-l-green-400' : 
                              entity.avgSentiment < 0.4 ? 'border-l-red-400' : 
                              'border-l-yellow-400'
                            }`}
                          >
                            {entity.name} ({entity.mentions})
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {/* Activities */}
                {entities.filter(e => e.type === 'activity').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                      <Activity className="h-4 w-4 text-[#9AAB63]" />
                      Activities & Habits
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {entities
                        .filter(e => e.type === 'activity')
                        .map(entity => (
                          <Badge 
                            key={entity.name}
                            variant="outline"
                            className={`px-3 py-1.5 border-l-4 ${
                              entity.avgSentiment > 0.6 ? 'border-l-green-400' : 
                              entity.avgSentiment < 0.4 ? 'border-l-red-400' : 
                              'border-l-yellow-400'
                            }`}
                          >
                            {entity.name} ({entity.mentions})
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {/* Places */}
                {entities.filter(e => e.type === 'place').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                      <Map className="h-4 w-4 text-[#F5D867]" />
                      Places & Environments
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {entities
                        .filter(e => e.type === 'place')
                        .map(entity => (
                          <Badge 
                            key={entity.name}
                            variant="outline"
                            className={`px-3 py-1.5 border-l-4 ${
                              entity.avgSentiment > 0.6 ? 'border-l-green-400' : 
                              entity.avgSentiment < 0.4 ? 'border-l-red-400' : 
                              'border-l-yellow-400'
                            }`}
                          >
                            {entity.name} ({entity.mentions})
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {entities.length === 0 && (
                  <div className="text-center py-6">
                    <Search className="h-10 w-10 text-gray-300 mb-3 mx-auto" />
                    <p className="text-gray-600">
                      Continue journaling to discover correlations between your activities and emotions.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-['Montserrat_Variable']">
              <Rocket className="h-5 w-5 text-[#F5B8DB]" />
              Key Insights
            </CardTitle>
            <CardDescription>
              Discoveries from analyzing your journal patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Journaling Frequency Correlation */}
              {frequencyCorrelation && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="mt-1">
                    <Sparkles className={`h-5 w-5 ${
                      frequencyCorrelation.type === 'positive' ? 'text-green-500' :
                      frequencyCorrelation.type === 'negative' ? 'text-[#F5B8DB]' :
                      'text-[#F5D867]'
                    }`} />
                  </div>
                  <div>
                    <p className="text-gray-700">{frequencyCorrelation.text}</p>
                    {frequencyCorrelation.type !== 'neutral' && frequencyCorrelation.difference !== "0" && (
                      <p className="text-xs text-gray-500 mt-1">
                        {frequencyCorrelation.type === 'positive' 
                          ? `Sentiment is ${frequencyCorrelation.difference}% higher in weeks with more journaling.`
                          : `Sentiment is ${frequencyCorrelation.difference}% different during high journaling weeks.`
                        }
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Theme Correlations */}
              {themeCorrelations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                    <Tag className="h-4 w-4 text-[#9AAB63]" />
                    Themes That Impact Your Mood
                  </h4>
                  
                  <div className="space-y-3">
                    {themeCorrelations
                      .filter(tc => tc.difference > 0.5)
                      .slice(0, 2)
                      .map((theme, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                          <div className="mt-1">
                            <Zap className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-gray-700">
                              When you write about <span className="font-medium">{theme.theme}</span>, your mood tends to be higher.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Your mood averages {theme.avgMood.toFixed(1)}/5 after these entries.
                            </p>
                          </div>
                        </div>
                      ))
                    }
                    
                    {themeCorrelations
                      .filter(tc => tc.difference < -0.5)
                      .slice(0, 2)
                      .map((theme, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
                          <div className="mt-1">
                            <Lightbulb className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-gray-700">
                              Entries about <span className="font-medium">{theme.theme}</span> correlate with lower mood ratings.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Your mood averages {theme.avgMood.toFixed(1)}/5 after these entries.
                            </p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
              
              {/* Placeholder if not enough data */}
              {!frequencyCorrelation && themeCorrelations.length === 0 && (
                <div className="text-center py-6">
                  <Search className="h-10 w-10 text-gray-300 mb-3 mx-auto" />
                  <p className="text-gray-600">
                    Not enough data to show correlations yet. Continue journaling and tracking your mood regularly to uncover insights.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}