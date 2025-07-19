import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../components/layout/Layout';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BusinessCTA from '../components/common/BusinessCTA';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    question: "What is Black Dollar Network?",
    answer: "Black Dollar Network (BDN) is a Black-owned and Black-led fintech company dedicated to leveraging technology to educate, equip, and empower individuals in building stronger businesses, families, and communities. Learn more [about us](/about).",
    category: "General"
  },
  {
    question: "How do I list my business on the directory?",
    answer: "To list your business, create an account and [select a subscription plan](/pricing). You can then add your business details, images, and other information through your dashboard.",
    category: "Business Listing"
  },
  {
    question: "What are the benefits of listing my business?",
    answer: "Benefits include increased visibility to targeted customers, verified business status, analytics tools, and connection to a growing network of Black-owned businesses and supporters.",
    category: "Business Listing"
  },
  {
    question: "How much does it cost to list my business?",
    answer: "We offer different subscription plans starting at as little as $1/month (billed annually). Each plan comes with different features and benefits. [Visit our pricing page](/pricing) for detailed information.",
    category: "Pricing"
  },
  {
    question: "How do I verify my business?",
    answer: "Business verification is included with our Enhanced plan. Once you subscribe, our team will review your business information and verify your ownership status.",
    category: "Verification"
  },
  {
    question: "Can I update my business information after listing?",
    answer: "Yes, you can update your business information anytime through [your dashboard](/dashboard). Changes will be reflected immediately on your listing.",
    category: "Business Management"
  },
  {
    question: "How can customers support listed businesses?",
    answer: "Customers can support businesses by making purchases, leaving reviews, sharing listings on social media, and sending tips through our platform.",
    category: "Support"
  },
  {
    question: "What is PROJECT UNITY?",
    answer: `PROJECT UNITY is our community-driven initiative to create lasting economic change through comprehensive group economics and corrective economics, encouraging participation from all communities. <a href='https://www.sowempowered.com' target='_blank' rel='noopener noreferrer'>Support today!</a>`,
    category: "Initiatives"
  },
  {
    question: "How secure is my business information?",
    answer: "We use industry-standard security measures to protect your data. All sensitive information is encrypted, and we never share your private data with third parties.",
    category: "Security"
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept all major credit cards, debit cards, and digital payment methods for business subscriptions and customer transactions.",
    category: "Payments"
  }
];

const FAQsPage = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(faqs.map(faq => faq.category))];

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredFaqs = selectedCategory === 'All' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-400">
            Find answers to common questions about BDN and our services.
          </p>
        </div>

        <div className="relative mb-12">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10" />
          
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 px-8 min-w-max">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-white text-black'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-900 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <span className="text-white font-medium">{faq.question}</span>
                {openItems.includes(index) ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {openItems.includes(index) && (
                <div className="px-6 pb-4">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{faq.answer}</ReactMarkdown>
                  
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-900 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Still have questions?</h2>
          <p className="text-gray-400 mb-6">
            Can't find the answer you're looking for? Please reach out to our friendly team.
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
      
      {/* Add the CTA section */}
      <BusinessCTA />
    </Layout>
  );
};

export default FAQsPage;