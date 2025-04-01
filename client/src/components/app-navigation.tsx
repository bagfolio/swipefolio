import { Home, BarChart3, Briefcase, User, Trophy, GamepadIcon } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function AppNavigation() {
  const [location, setLocation] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="app-navigation fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200/70 shadow-sm">
      <div className="flex items-center justify-around px-2 py-1.5">
        <NavItem 
          icon={<Home className="w-5 h-5" />} 
          label="Home" 
          isActive={isActive("/")}
          href="/"
        />
        
        <NavItem 
          icon={<Trophy className="w-5 h-5" />} 
          label="Leaderboard" 
          isActive={isActive("/leaderboard")}
          href="/leaderboard"
        />
        
        <NavItem 
          icon={<Briefcase className="w-5 h-5" />} 
          label="Portfolio" 
          isActive={isActive("/portfolio")}
          href="/portfolio"
        />
        
        <NavItem 
          icon={<GamepadIcon className="w-5 h-5" />} 
          label="Games" 
          isActive={isActive("/games") || location.startsWith("/games/")}
          href="/games"
        />
        
        <NavItem 
          icon={<User className="w-5 h-5" />} 
          label="Profile" 
          isActive={isActive("/profile")}
          href="/profile"
        />
      </div>
      
      {/* Add home indicator line for iOS-like feel */}
      <div className="flex justify-center pb-1">
        <div className="w-[134px] h-1 bg-slate-400/30 rounded-full"></div>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  href: string;
}

function NavItem({ icon, label, isActive, href }: NavItemProps) {
  const [_, setLocation] = useLocation();
  
  const handleClick = () => {
    setLocation(href);
  };
  
  // Define animation variants for tab indicators and icons
  const tabVariants = {
    active: {
      scale: 1.1,
      opacity: 1,
      y: -2,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    },
    inactive: {
      scale: 1,
      opacity: 0.75,
      y: 0,
      transition: { duration: 0.2 }
    }
  };
  
  // Define glow effect for active tab
  const glowVariants = {
    active: {
      opacity: 0.8,
      scale: 1,
      transition: { duration: 0.3 }
    },
    inactive: {
      opacity: 0,
      scale: 0.5,
      transition: { duration: 0.3 }
    }
  };
  
  // Define animation for active indicator
  const indicatorVariants = {
    active: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 25 }
    },
    inactive: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <motion.button 
      className="flex flex-col items-center justify-center py-1.5 px-2 relative"
      onClick={handleClick}
      whileTap={{ scale: 0.92, y: 1 }}
    >
      {/* Glow effect behind icon for active state - iOS style with subtle gradient */}
      <motion.div
        className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400/15 to-blue-500/25 blur-md"
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
        variants={glowVariants}
      />
      
      {/* Icon container with iOS-style animation */}
      <motion.div 
        className={`relative z-10 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
        variants={tabVariants}
      >
        {icon}
      </motion.div>
      
      {/* Label - iOS-style smaller text */}
      <motion.span 
        className={`text-[10px] mt-1 font-medium ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
        animate={{ 
          opacity: isActive ? 1 : 0.7,
          y: isActive ? 0 : 1
        }}
      >
        {label}
      </motion.span>
      
      {/* iOS-style subtle dot indicator under active tab */}
      <motion.div 
        className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2"
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
        variants={indicatorVariants}
      >
        <div className="h-1 w-1 rounded-full bg-indigo-600" />
      </motion.div>
    </motion.button>
  );
}