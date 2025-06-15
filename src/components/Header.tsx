
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/813d9d8b-5d4a-4774-a660-04b008430712.png" 
              alt="CareerBoost AI" 
              className="h-8 w-auto"
            />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              Home
            </Link>
            <Link to="/pricing" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              Pricing
            </Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              Dashboard
            </Link>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              Get Started
            </Button>
          </div>
          
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-700 hover:text-purple-600 font-medium">
                Home
              </Link>
              <Link to="/pricing" className="text-gray-700 hover:text-purple-600 font-medium">
                Pricing
              </Link>
              <Link to="/dashboard" className="text-gray-700 hover:text-purple-600 font-medium">
                Dashboard
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="outline" className="border-gray-300 text-gray-700">
                  Sign In
                </Button>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
