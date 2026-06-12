import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export const AiLoader = ({ size = 200, text = "Hazırlanıyor" }) => {
  const letters = text.split("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800&display=swap');
          
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: transparent;
            font-family: 'Nunito', sans-serif;
            overflow: hidden;
          }

          .loader-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${size}px;
            height: ${size}px;
            user-select: none;
          }

          .letters-wrapper {
            position: absolute;
            text-align: center;
            width: 75%;
            line-height: 1.4;
            z-index: 10;
          }

          .letter {
            display: inline-block;
            color: #1A1D20;
            font-weight: 800;
            font-size: 16px;
            opacity: 0.4;
          }

          .space {
            display: inline-block;
            width: 6px;
          }

          .animate-loaderCircle {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            animation: loaderCircle 5s linear infinite;
          }

          .animate-loaderLetter {
            animation: loaderLetter 3s infinite;
          }

          @keyframes loaderCircle {
            0% {
              transform: rotate(90deg);
              box-shadow:
                0 6px 12px 0 #38bdf8 inset,
                0 12px 18px 0 #005dff inset,
                0 36px 36px 0 #1e40af inset,
                0 0 3px 1.2px rgba(56, 189, 248, 0.3),
                0 0 6px 1.8px rgba(0, 93, 255, 0.2);
            }
            50% {
              transform: rotate(270deg);
              box-shadow:
                0 6px 12px 0 #60a5fa inset,
                0 12px 6px 0 #0284c7 inset,
                0 24px 36px 0 #005dff inset,
                0 0 3px 1.2px rgba(56, 189, 248, 0.3),
                0 0 6px 1.8px rgba(0, 93, 255, 0.2);
            }
            100% {
              transform: rotate(450deg);
              box-shadow:
                0 6px 12px 0 #4dc8fd inset,
                0 12px 18px 0 #005dff inset,
                0 36px 36px 0 #1e40af inset,
                0 0 3px 1.2px rgba(56, 189, 248, 0.3),
                0 0 6px 1.8px rgba(0, 93, 255, 0.2);
            }
          }

          @keyframes loaderLetter {
            0%, 100% {
              opacity: 0.4;
              transform: translateY(0);
            }
            20% {
              opacity: 1;
              transform: scale(1.15);
            }
            40% {
              opacity: 0.7;
              transform: translateY(0);
            }
          }
        </style>
      </head>
      <body>
        <div class="loader-container">
          <div class="letters-wrapper">
            ${letters.map((letter, index) => {
    if (letter === ' ') {
      return ' <span class="space"></span> ';
    }
    return `<span class="letter animate-loaderLetter" style="animation-delay: ${index * 0.05}s">${letter}</span>`;
  }).join('')}
          </div>
          <div class="animate-loaderCircle"></div>
        </div>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  }
});