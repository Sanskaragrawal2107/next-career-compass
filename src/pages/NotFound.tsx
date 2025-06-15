
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      
      <div className="pt-20 pb-12 flex items-center justify-center min-h-screen">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src="/lovable-uploads/813d9d8b-5d4a-4774-a660-04b008430712.png" 
                alt="CareerBoost AI" 
                className="h-16 w-auto opacity-50"
              />
            </div>
            
            {/* 404 Animation */}
            <div className="mb-8">
              <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-pulse">
                404
              </h1>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-bounce">
                  <Search className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Message */}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Oops! Page Not Found
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
              It looks like the page you're looking for has been moved, deleted, or doesn't exist. 
              Don't worry, let's get you back on track to boost your career!
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-4 rounded-full text-lg font-semibold"
                >
                  Go to Dashboard
                </Button>
              </Link>
            </div>
            
            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 mb-4">You might be looking for:</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/" className="text-purple-600 hover:text-purple-800 font-medium">
                  Home
                </Link>
                <Link to="/pricing" className="text-purple-600 hover:text-purple-800 font-medium">
                  Pricing
                </Link>
                <Link to="/dashboard" className="text-purple-600 hover:text-purple-800 font-medium">
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
