import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  TrendingUp,
  Award,
  Target,
  Brain,
  MessageSquare,
  Zap,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PostLoginHeader from '../components/PostLoginHeader';
import axios from 'axios';

const ResultDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState(null);
  const [referenceLinks, setReferenceLinks] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const { id: session_id } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('general');
  const [error, setError] = useState(null);
  
  // Default result data structure
  const getDefaultResultData = () => ({
    interviewName: `Interview Session`,
    date: new Date().toLocaleDateString(),
    duration: 'N/A',
    overallScore: 0,
    generalScores: {
      technical_skill_score: 0,
      communication_skills_score: 0,
      questions_understanding_score: 0,
      problem_solving_score: 0,
      DepthOfKnowlege_score: 0
    },
    domainResults: [],
    rawData: null
  });
  // Fetch interview results
  useEffect(() => {
    const fetchInterviewResults = async () => {
      setLoading(true);
      setError(null);
      
      // Fetch main interview results
      try {
        const resultResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/interview/interview-result/${session_id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        
        const data = resultResponse.data?.data || resultResponse.data || {};
        
        // Calculate overall score (average of 5 scores excluding domain_specific_score)
        const scores = [
          data.technical_skill_score*10 || 0,
          data.communication_skills_score*10 || 0,
          data.questions_understanding_score*10 || 0,
          data.problem_solving_score*10 || 0,
          data.DepthOfKnowlege_score*10 || 0
        ];
        const overallScore = scores.some(score => score > 0) 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
        
        // Process domain results for bar chart
        const domainResults = data.domain_specific_score?.map(domain => ({
          domain: domain.domainName || 'Unknown',
          Number_of_answers_correct: domain.Number_of_answers_correct || 0,
          Number_of_answers_incorrect: domain.Number_of_answers_incorrect || 0,
          Number_of_skiped_questions: domain.Number_of_skiped_questions || 0,
          Number_of_question: domain.Number_of_question || 0
        })) || [];
        
        setResultData({
          interviewName: `Interview Session`,
          date: new Date(data.createdAt || Date.now()).toLocaleDateString(),
          duration: 'N/A',
          overallScore,
          generalScores: {
            technical_skill_score: data.technical_skill_score*10 || 0,
            communication_skills_score: data.communication_skills_score*10 || 0,
            questions_understanding_score: data.questions_understanding_score*10 || 0,
            problem_solving_score: data.problem_solving_score*10 || 0,
            DepthOfKnowlege_score: data.DepthOfKnowlege_score*10 || 0
          },
          domainResults,
          rawData: data
        });
      } catch (err) {
        console.error('Error fetching interview results:', err);
        // If main results fail, set default data
        setResultData(getDefaultResultData());
      }
      
      // Fetch reference links and Q&A separately
      try {
        const referenceResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/interview/interview-result/reference_links/${session_id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        
        // Process reference links data based on MongoDB structure
        const processedTopics = [];
        if (referenceResponse.data) {
          const responseData = referenceResponse.data?.data || referenceResponse.data;
          console.log('Full API Response:', referenceResponse.data);
          console.log('Response Data:', responseData);
          
          // Handle MongoDB Map structure with refrenceLinks (note the typo in backend)
          let referenceLinksData = null;
          
          // Check for refrenceLinks (with typo) - this is the actual MongoDB field
          if (responseData.refrenceLinks) {
            referenceLinksData = responseData.refrenceLinks;
          }
          // Fallback to correct spelling
          else if (responseData.referenceLinks) {
            referenceLinksData = responseData.referenceLinks;
          }
          // Check if data has links and qa arrays directly (legacy format)
          else if (responseData.links && responseData.qa) {
            referenceLinksData = {
              'Interview_Session': {
                links: responseData.links,
                qa: responseData.qa
              }
            };
          }
          
          console.log('Reference Links Data:', referenceLinksData);
          
          // Process Map or Object structure
          if (referenceLinksData) {
            // Handle Map object (convert to entries if needed)
            let entries = [];
            
            if (referenceLinksData instanceof Map) {
              entries = Array.from(referenceLinksData.entries());
            } else if (typeof referenceLinksData === 'object') {
              entries = Object.entries(referenceLinksData);
            }
            
            console.log('Processing entries:', entries);
            
            entries.forEach(([topicKey, topicData], topicIndex) => {
              console.log(`Processing topic: ${topicKey}`, topicData);
              
              if (topicData && typeof topicData === 'object') {
                const topicLinks = topicData.links || [];
                const topicQA = topicData.qa || [];
                
                // Process Q&A pairs for this topic
                const processedQA = [];
                if (Array.isArray(topicQA)) {
                  // Process QA data - if qa[0] is question and qa[1] is answer (not two separate questions)
                  if (topicQA.length >= 2 && Array.isArray(topicQA) && !Array.isArray(topicQA[0])) {
                    // Handle case where the entire topicQA array is a single question-answer pair
                    // where qa[0] is the question and qa[1] is the answer
                    processedQA.push({
                      id: `${topicKey}_1`,
                      question: topicQA[0] || 'Question not available',
                      userAnswer: topicQA[1] || 'No answer provided',
                      status: topicQA[1] ? 'answered' : 'skipped'
                    });
                  } else {
                    // Handle the original case where topicQA is an array of individual QA items
                    topicQA.forEach((qaItem, qaIndex) => {
                      if (typeof qaItem === 'string') {
                        // Handle case where qa is array of strings
                        processedQA.push({
                          id: `${topicKey}_${qaIndex + 1}`,
                          question: qaItem,
                          userAnswer: 'Response recorded during interview',
                          status: 'answered'
                        });
                      } else if (Array.isArray(qaItem) && qaItem.length >= 2) {
                        // Handle case where qa is array of [question, answer] pairs
                        processedQA.push({
                          id: `${topicKey}_${qaIndex + 1}`,
                          question: qaItem[0] || 'Question not available',
                          userAnswer: qaItem[1] || 'No answer provided',
                          status: qaItem[1] ? 'answered' : 'skipped'
                        });
                      }
                    });
                  }
                }
                
                // Create topic object with better name parsing for complex keys
                const topicName = topicKey
                  .split(' ')
                  .slice(0, 3) // Take first 3 words for cleaner display
                  .join(' ')
                  .replace(/[_-]/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase());
                
                const topicObj = {
                  id: topicIndex + 1,
                  topicName: topicName || 'Interview Topic',
                  originalKey: topicKey,
                  fullTopicName: topicKey, // Keep full name for reference
                  links: Array.isArray(topicLinks) ? topicLinks : [],
                  qa: processedQA,
                  totalQuestions: processedQA.length
                };
                
                console.log('Created topic object:', topicObj);
                processedTopics.push(topicObj);
              }
            });
          }
        }
        
        console.log('Final processed topics:', processedTopics);
        setTopicData(processedTopics);
        
        // Also set legacy referenceLinks for backward compatibility
        const allQA = [];
        processedTopics.forEach(topic => {
          topic.qa.forEach(qa => {
            allQA.push({
              ...qa,
              topic: topic.topicName,
              links: topic.links
            });
          });
        });
        console.log('Legacy reference links:', allQA);
        setReferenceLinks(allQA);
        
      } catch (err) {
        console.error('Error fetching reference links:', err);
        // If reference links fail, just set empty arrays
        setReferenceLinks([]);
        setTopicData([]);
      }
      
      setLoading(false);
    };
    
    if (session_id) {
      fetchInterviewResults();
    } else {
      // If no session_id, set default data
      setResultData(getDefaultResultData());
      setLoading(false);
    }
  }, [session_id]);

  // Custom label for donut charts
  const renderCustomLabel = (value, name) => {
    return `${value}%`;
  };

  // Donut chart component
  const DonutChart = ({ score, label, icon: Icon, color }) => {
    const data = [
      { name: 'Score', value: score },
      { name: 'Remaining', value: 100 - score }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-green-500/20 p-6 hover:border-green-400/40 transition-all duration-300"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-white font-semibold">{label}</h3>
        </div>
        
        <div className="relative h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                <Cell fill="#22ff44" />
                <Cell fill="#1a1a1a" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{score}%</div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'correct':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'incorrect':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'answered':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'correct':
        return 'border-green-500/30 bg-green-500/10';
      case 'incorrect':
        return 'border-red-500/30 bg-red-500/10';
      case 'partial':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'answered':
        return 'border-green-500/30 bg-green-500/10';
      case 'skipped':
        return 'border-gray-500/30 bg-gray-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading interview results...</p>
        </div>
      </div>
    );
  }
  
  // Don't show error state anymore, just proceed with default values
  // Error handling is now done by setting default values
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-black to-green-400/5"></div>
      
      <PostLoginHeader />
      
      <main className="relative z-10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate('/history')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-green-500/30 rounded-lg hover:bg-green-500/10 hover:border-green-400/50 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Back to History</span>
              </button>
              
              <div className="flex items-center gap-3">
                <button className="p-2 bg-gray-900/50 border border-green-500/30 rounded-lg hover:bg-green-500/10 hover:border-green-400/50 transition-all duration-300">
                  <Download className="w-5 h-5 text-green-400" />
                </button>
                <button className="p-2 bg-gray-900/50 border border-green-500/30 rounded-lg hover:bg-green-500/10 hover:border-green-400/50 transition-all duration-300">
                  <Share2 className="w-5 h-5 text-green-400" />
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/50 backdrop-blur-sm rounded-xl border border-green-500/20 p-6">
              <h1 className="text-3xl font-bold text-white mb-2">{resultData?.interviewName || 'Interview Session'}</h1>
              <div className="flex items-center gap-6 text-gray-400">
                <span>{resultData?.date || new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span>{resultData?.duration || 'N/A'}</span>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <span>Overall Score:</span>
                  <span className="text-2xl font-bold text-green-400">{resultData?.overallScore || 0}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex gap-4 mb-8 border-b border-gray-800"
          >
            {['general', 'domain', 'review'].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
                  activeSection === section
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-400 border-transparent hover:text-green-300'
                }`}
              >
                {section === 'general' && 'General Results'}
                {section === 'domain' && 'Domain Specific'}
                {section === 'review' && 'Review Q&A'}
              </button>
            ))}
          </motion.div>

          {/* General Results Section */}
          {activeSection === 'general' && resultData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
            >
              <DonutChart 
                score={resultData.generalScores.technical_skill_score} 
                label="Technical Skills"
                icon={Zap}
                color="from-green-400 to-green-600"
              />
              <DonutChart 
                score={resultData.generalScores.communication_skills_score} 
                label="Communication"
                icon={MessageSquare}
                color="from-green-400 to-green-600"
              />
              <DonutChart 
                score={resultData.generalScores.questions_understanding_score} 
                label="Understanding"
                icon={Brain}
                color="from-green-400 to-green-600"
              />
              <DonutChart 
                score={resultData.generalScores.problem_solving_score} 
                label="Problem Solving"
                icon={Target}
                color="from-green-400 to-green-600"
              />
              <DonutChart 
                score={resultData.generalScores.DepthOfKnowlege_score} 
                label="Depth of Knowledge"
                icon={Award}
                color="from-green-400 to-green-600"
              />
            </motion.div>
          )}

          {/* Domain Specific Results Section */}
          {activeSection === 'domain' && resultData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-green-500/20 p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Performance by Domain</h2>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resultData.domainResults}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis 
                      dataKey="domain" 
                      stroke="#666"
                      tick={{ fill: '#888' }}
                    />
                    <YAxis 
                      stroke="#666"
                      tick={{ fill: '#888' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0a0a0a', 
                        border: '1px solid #22ff44',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#22ff44' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                    />
                    <Bar 
                      dataKey="Number_of_answers_correct" 
                      fill="#22ff44" 
                      name="Correct"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="Number_of_answers_incorrect" 
                      fill="#ff4444" 
                      name="Incorrect"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="Number_of_skiped_questions" 
                      fill="#666666" 
                      name="Skipped"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {resultData.domainResults.reduce((acc, curr) => acc + curr.Number_of_answers_correct, 0)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Total Correct</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">
                    {resultData.domainResults.reduce((acc, curr) => acc + curr.Number_of_answers_incorrect, 0)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Total Incorrect</div>
                </div>
                <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-gray-400">
                    {resultData.domainResults.reduce((acc, curr) => acc + curr.Number_of_skiped_questions, 0)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Total Skipped</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Review Q&A Section */}
          {activeSection === 'review' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {topicData.length > 0 ? (
                topicData.map((topic, topicIndex) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: topicIndex * 0.1, duration: 0.5 }}
                    className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-green-500/20 overflow-hidden"
                  >
                    {/* Topic Header */}
                    <div className="bg-gradient-to-r from-green-500/10 to-green-400/5 p-6 border-b border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-black" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">{topic.topicName}</h2>
                            <p className="text-xs text-gray-500 mb-1" title={topic.fullTopicName}>
                              {topic.fullTopicName}
                            </p>
                            <p className="text-sm text-gray-400">
                              {topic.totalQuestions} question{topic.totalQuestions !== 1 ? 's' : ''} • {topic.links.length} reference{topic.links.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                            TOPIC {topic.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Topic Content */}
                    <div className="p-6 space-y-6">
                      {/* Reference Links Section */}
                      {topic.links && topic.links.length > 0 && (
                        <div className="bg-green-500/5 rounded-lg p-4 border border-green-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <ExternalLink className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium text-green-400">Reference Materials ({topic.links.length})</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {topic.links.map((link, linkIndex) => (
                              <a
                                key={linkIndex}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-gray-800/30 rounded-lg border border-green-500/10 hover:border-green-400/30 hover:bg-green-500/5 transition-all duration-300 group"
                              >
                                <ExternalLink className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                                <span className="text-sm text-gray-300 group-hover:text-white truncate flex-1">
                                  {link.replace('https://', '').replace('http://', '').split('/')[0]}
                                </span>
                                <span className="text-xs text-gray-500 group-hover:text-gray-400">↗</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Q&A Section */}
                      {topic.qa && topic.qa.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium text-green-400">Questions & Answers ({topic.qa.length})</span>
                          </div>
                          
                          {topic.qa.map((qa, qaIndex) => (
                            <motion.div
                              key={qa.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (topicIndex * 0.1) + (qaIndex * 0.05), duration: 0.3 }}
                              className={`bg-gray-800/30 rounded-lg border ${getStatusColor(qa.status)} p-4`}
                            >
                              <div className="flex items-start gap-3">
                                {getStatusIcon(qa.status)}
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-medium text-gray-400">Q{qaIndex + 1}</span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        qa.status === 'answered' ? 'bg-green-500/20 text-green-400' :
                                        qa.status === 'skipped' ? 'bg-gray-500/20 text-gray-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                      }`}>
                                        {qa.status === 'answered' ? 'Answered' : 
                                         qa.status === 'skipped' ? 'Skipped' : 'Partial'}
                                      </span>
                                    </div>
                                    <p className="text-gray-300 font-medium">{qa.question}</p>
                                  </div>
                                  
                                  {qa.userAnswer && qa.userAnswer !== 'No answer provided' && (
                                    <div className="bg-gray-900/50 rounded-lg p-3 border-l-4 border-green-500/30">
                                      <div className="text-xs text-green-400 mb-1 font-medium">Your Response:</div>
                                      <p className="text-sm text-gray-300 leading-relaxed">{qa.userAnswer}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No review data available</p>
                  <p className="text-gray-500 text-sm">Interview results and reference materials will appear here after completion.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResultDashboard;
