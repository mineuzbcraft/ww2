
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 4%;
    --foreground: 210 40% 98%;
    --card: 222 47% 6%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 6%;
    --popover-foreground: 210 40% 98%;
    --primary: 243 75% 59%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 262 83% 58%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 243 75% 59%;
    --radius: 2rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-[#020617] text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-tap-highlight-color: transparent;
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-indigo-900/40 rounded-full;
}

/* Optimized Animations for iPhone 7 */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
  will-change: transform;
}

@keyframes glow-gold {
  0%, 100% { box-shadow: 0 0 15px rgba(234, 179, 8, 0.2); }
  50% { box-shadow: 0 0 30px rgba(234, 179, 8, 0.4); }
}

.animate-glow-gold {
  animation: glow-gold 4s ease-in-out infinite;
}

/* Entrance Animations */
.animate-in {
  animation-duration: 500ms;
  animation-fill-mode: both;
}

.fade-in {
  animation-name: fadeIn;
}

.slide-in-from-top {
  animation-name: slideInTop;
}

.slide-in-from-left {
  animation-name: slideInLeft;
}

.slide-in-from-right {
  animation-name: slideInRight;
}

.zoom-in {
  animation-name: zoomIn;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInTop {
  from { transform: translateY(-15px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInLeft {
  from { transform: translateX(-15px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.98); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
