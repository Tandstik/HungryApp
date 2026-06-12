import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, interpolate, Extrapolation } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { GoogleGenAI } from '@google/genai';
import { AiLoader } from '../components/AiLoader';
import { IngredientIcon } from '../components/IngredientIcons';
import { shouldUseDB, getRecipesFromDB, saveRecipesToDB, aiCardToStoredRecipe, getRecipeCount, StoredRecipe } from '../services/recipeDatabase';

const { width, height } = Dimensions.get('window');

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const INGREDIENTS_DATA = [
  // Et ve Protein
  { id: '1', name: 'Kıyma', icon: '🥩' },
  { id: '2', name: 'Tavuk', icon: '🍗' },
  { id: '3', name: 'Balık', icon: '🐟' },
  { id: '4', name: 'Yumurta', icon: '🥚' },
  { id: '5', name: 'Sucuk', icon: '🌭' },
  { id: '33', name: 'Ton Balığı', icon: '🐟' },
  
  // Sebzeler
  { id: '6', name: 'Soğan', icon: '🧅' },
  { id: '7', name: 'Domates', icon: '🍅' },
  { id: '8', name: 'Salatalık', icon: '🥒' },
  { id: '9', name: 'Patates', icon: '🥔' },
  { id: '10', name: 'Sarımsak', icon: '🧄' },
  { id: '11', name: 'Biber', icon: '🫑' },
  { id: '12', name: 'Havuç', icon: '🥕' },
  { id: '13', name: 'Brokoli', icon: '🥦' },
  { id: '14', name: 'Mantar', icon: '🍄' },
  { id: '15', name: 'Patlıcan', icon: '🍆' },
  { id: '16', name: 'Kabak', icon: '🥒' },
  { id: '17', name: 'Limon', icon: '🍋' },
  { id: '34', name: 'Mısır', icon: '🌽' },
  { id: '35', name: 'Bezelye', icon: '🫛' },
  { id: '29', name: 'Maydanoz', icon: '🌿' },
  { id: '30', name: 'Dereotu', icon: '🌿' },

  // Süt Ürünleri
  { id: '18', name: 'Peynir', icon: '🧀' },
  { id: '19', name: 'Süt', icon: '🥛' },
  { id: '20', name: 'Tereyağı', icon: '🧈' },
  { id: '21', name: 'Yoğurt', icon: '🥣' },
  
  // Karbonhidrat & Bakliyat & Diğer
  { id: '22', name: 'Ekmek', icon: '🍞' },
  { id: '23', name: 'Makarna', icon: '🍝' },
  { id: '24', name: 'Pirinç', icon: '🍚' },
  { id: '25', name: 'Bulgur', icon: '🌾' },
  { id: '26', name: 'Mercimek', icon: '🧆' },
  { id: '27', name: 'Nohut', icon: '🧆' },
  { id: '28', name: 'Fasulye', icon: '🫘' },
  { id: '31', name: 'Un', icon: '🌾' },
  { id: '32', name: 'Şeker', icon: '🧂' },
];

export default function App() {
  const [appState, setAppState] = useState<'IDLE' | 'SELECTING' | 'LOADING' | 'RECIPES' | 'LOADING_DETAIL' | 'RECIPE_DETAIL'>('IDLE');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [activeRecipe, setActiveRecipe] = useState<any>(null);
  const [recipeSource, setRecipeSource] = useState<'AI' | 'DB'>('AI');

  const fridgeScale = useSharedValue(1);
  const fridgeOpacity = useSharedValue(1);
  const contentOpacity = useSharedValue(0);

  const handleFridgePress = () => {
    fridgeScale.value = withSpring(5, { damping: 20, stiffness: 90 });
    fridgeOpacity.value = withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) });

    setTimeout(() => {
      setAppState('SELECTING');
      contentOpacity.value = withTiming(1, { duration: 500 });
    }, 400);
  };

  const goBackToIdle = () => {
    contentOpacity.value = withTiming(0, { duration: 300 });

    setTimeout(() => {
      setAppState('IDLE');
      fridgeScale.value = withSpring(1, { damping: 20, stiffness: 90 });
      fridgeOpacity.value = withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) });
    }, 300);
  };

  const toggleIngredient = (id: string) => {
    setSelectedIngredients(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getRecipes = async () => {
    if (selectedIngredients.length === 0) return;

    setAppState('LOADING');
    contentOpacity.value = withTiming(0, { duration: 300 });

    try {
      // DB kararı al
      const useDB = await shouldUseDB();

      if (useDB) {
        // DATABASE'DEN ÇEK
        const dbRecipes = await getRecipesFromDB(selectedIngredients, 3);
        if (dbRecipes.length > 0) {
          setRecipes(dbRecipes.map(r => ({ ...r, _fromDB: true })));
          setRecipeSource('DB');
          setAppState('RECIPES');
          contentOpacity.value = withTiming(1, { duration: 500 });
          return;
        }
        // DB'de yeterli tarif yoksa AI'a düş
      }

      // AI İLE ÜRET
      setRecipeSource('AI');
      const ingredientNames = INGREDIENTS_DATA
        .filter(i => selectedIngredients.includes(i.id))
        .map(i => i.name)
        .join(', ');

      const prompt = `Şu malzemelere sahibim: ${ingredientNames}. Bana bu malzemeleri kullanarak yapabileceğim en fazla 3 adet yaratıcı yemek tarifi FİKRİ öner. 
Sadece yemeğin adını, çok kısa bir özetini, tahmini süresini ve zorluk seviyesini ver.
Lütfen sonucu sadece şu formatta JSON olarak döndür (başka hiçbir markdown veya açıklama yazma, sadece saf JSON listesi olsun):
[
  {
    "title": "Yemek Adı",
    "summary": "Tek cümlelik kısa lezzet özeti",
    "time": "Tahmini süre (örn: 35 dk)",
    "difficulty": "Zorluk seviyesi"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      let text = response.text || "";
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) text = arrayMatch[0];
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(text);

      // AI kartlarına selectedIngredientIds ekle (DB için)
      const aiCards = data.map((card: any) => ({
        ...card,
        _selectedIngredientIds: [...selectedIngredients],
        _fromDB: false,
      }));

      setRecipes(aiCards);
      setAppState('RECIPES');
      contentOpacity.value = withTiming(1, { duration: 500 });

    } catch (error) {
      console.error(error);
      alert('Tarifler alınırken bir hata oluştu!');
      setAppState('SELECTING');
      contentOpacity.value = withTiming(1, { duration: 300 });
    }
  };

  const getRecipeDetail = async (recipe: any) => {
    setActiveRecipe(recipe);

    // Eğer tarif detayları zaten yüklendiyse direkt göster
    if (recipe.ingredientsList?.length > 0 && recipe.steps?.length > 0) {
      setAppState('RECIPE_DETAIL');
      contentOpacity.value = withTiming(0, { duration: 200 });
      setTimeout(() => contentOpacity.value = withTiming(1, { duration: 500 }), 200);
      return;
    }

    setAppState('LOADING_DETAIL');
    contentOpacity.value = withTiming(0, { duration: 300 });

    const ingredientNames = INGREDIENTS_DATA
      .filter(i => selectedIngredients.includes(i.id))
      .map(i => i.name)
      .join(', ');

    try {
      const prompt = `Elimdeki malzemeler: ${ingredientNames}. 
Seçtiğim yemek: "${recipe.title}". 
Lütfen bu yemek için, *aşırı detaylı* bir tam malzeme listesi (net ölçüleriyle) ve *aşırı detaylı* adım adım şef tarzı yapılış talimatı oluştur.
Eksik ama tarif için zaruri olan baharat, yağ vb. standart malzemeleri de listeye ekle.
Lütfen sonucu sadece şu formatta JSON olarak döndür (başka markdown yazma):
{
  "ingredients": ["1 adet soğan", "200gr kıyma", "2 yemek kaşığı zeytinyağı", "..."],
  "steps": ["1. Adım: Soğanları ince ince piyazlık doğrayın.", "2. Adım: ..."]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      let text = response.text || "";
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) text = objMatch[0];
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(text);

      const fullRecipe = {
        ...recipe,
        ingredientsList: data.ingredients,
        steps: data.steps,
      };

      setActiveRecipe(fullRecipe);
      setRecipes(prev => prev.map(r => r.title === recipe.title ? fullRecipe : r));
      setAppState('RECIPE_DETAIL');
      contentOpacity.value = withTiming(1, { duration: 500 });

      // DB'ye kaydet (arka planda, UI'ı bloklamadan)
      const ingredientIds = recipe._selectedIngredientIds ?? selectedIngredients;
      const stored = aiCardToStoredRecipe(
        { title: recipe.title, summary: recipe.summary, time: recipe.time, difficulty: recipe.difficulty },
        ingredientIds,
        data.ingredients,
        data.steps
      );
      saveRecipesToDB([stored]).catch(console.error);

    } catch (error) {
      console.error(error);
      alert('Tarif detayı alınırken bir hata oluştu!');
      setAppState('RECIPES');
      contentOpacity.value = withTiming(1, { duration: 300 });
    }
  };

  const animatedFridgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: fridgeScale.value }],
      opacity: fridgeOpacity.value,
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [
        {
          translateY: interpolate(contentOpacity.value, [0, 1], [30, 0], Extrapolation.CLAMP)
        }
      ]
    };
  });

  return (
    <View className="flex-1 bg-slate-50">
      {appState === 'IDLE' && (
        <View className="flex-1 items-center justify-center">
          <Text className="font-['Nunito_800ExtraBold'] text-[42px] text-slate-900 mb-1">Aç mısın?</Text>
          <Text className="font-['Nunito_400Regular'] text-lg text-slate-500 mb-14">Dolabında neler var bir bakalım.</Text>

          <Pressable onPress={handleFridgePress} className="justify-center items-center" style={{ width: width * 0.7, height: height * 0.45 }}>
            <Animated.View className="w-full h-full shadow-2xl" style={animatedFridgeStyle}>
              <Image source={require('../../assets/images/fridge.png')} style={{ width: '100%', height: '100%' }} contentFit="contain" />
            </Animated.View>
          </Pressable>
          <Text className="font-['Nunito_700Bold'] text-base text-blue-600 mt-12 tracking-wide">Açmak için dokunun</Text>
        </View>
      )}

      {appState === 'SELECTING' && (
        <Animated.View className="flex-1 pt-12" style={animatedContentStyle}>
          <View className="px-6 mb-5">
            <Pressable 
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100 mb-4"
              onPress={goBackToIdle}
            >
              <Text className="text-xl text-slate-600">←</Text>
            </Pressable>
            <Text className="font-['Nunito_800ExtraBold'] text-3xl text-slate-900 mb-1.5">Dolapta Neler Var?</Text>
            <Text className="font-['Nunito_400Regular'] text-[15px] text-slate-500 leading-relaxed">Elindeki malzemeleri seç, sana en uygun tarifi bulalım.</Text>
          </View>

          <ScrollView contentContainerClassName="flex-row flex-wrap justify-between px-6 pb-32" showsVerticalScrollIndicator={false}>
            {INGREDIENTS_DATA.map((item) => {
              const isSelected = selectedIngredients.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleIngredient(item.id)}
                  className={`w-[48%] bg-white rounded-2xl p-4 mb-4 flex-row items-center border ${
                    isSelected ? 'bg-indigo-50 border-blue-600' : 'border-slate-100'
                  }`}
                  style={isSelected ? {
                    shadowColor: '#3b82f6',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 4
                  } : {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1
                  }}
                >
                  <View 
                    className={`w-12 h-12 rounded-xl justify-center items-center mr-3 ${isSelected ? 'bg-white' : 'bg-slate-50'}`}
                    style={isSelected ? {
                      shadowColor: '#bfdbfe',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.5,
                      shadowRadius: 2,
                      elevation: 1
                    } : {}}
                  >
                    <IngredientIcon id={item.id} size={28} />
                  </View>
                  <Text className={`font-['Nunito_700Bold'] text-[15px] ${isSelected ? 'text-blue-600' : 'text-slate-600'}`}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 p-6 bg-slate-50/90">
            <Pressable
              className={`py-4 rounded-2xl items-center ${
                selectedIngredients.length === 0 ? 'bg-slate-300' : 'bg-blue-600'
              }`}
              style={selectedIngredients.length === 0 ? {} : {
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
                elevation: 8
              }}
              onPress={getRecipes}
              disabled={selectedIngredients.length === 0}
            >
              <Text className="font-['Nunito_800ExtraBold'] text-base text-white">Tarif Bul</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {appState === 'LOADING' && (
        <View className="flex-1 justify-center items-center">
          <AiLoader text="Tarifler düşünülüyor" />
        </View>
      )}

      {appState === 'LOADING_DETAIL' && (
        <View className="flex-1 justify-center items-center">
          <AiLoader text="Tarif hazırlanıyor" />
        </View>
      )}

      {appState === 'RECIPES' && (
        <Animated.View className="flex-1 pt-16" style={animatedContentStyle}>
          <View className="px-6 mb-5">
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="font-['Nunito_800ExtraBold'] text-3xl text-slate-900">Sizin İçin Seçtiklerimiz</Text>
              <View className={`px-2 py-0.5 rounded-md ${recipeSource === 'DB' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                <Text className={`font-['Nunito_700Bold'] text-[10px] ${recipeSource === 'DB' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {recipeSource === 'DB' ? '📦 KAYITLI' : '✨ AI'}
                </Text>
              </View>
            </View>
            <Text className="font-['Nunito_400Regular'] text-[15px] text-slate-500 leading-relaxed">Aşağıdaki tariflerden birini seçerek detaylı hazırlanışına ulaşabilirsiniz.</Text>
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {recipes.map((r, i) => (
              <Pressable 
                key={i} 
                className="bg-white rounded-3xl p-6 mb-5 shadow-sm border border-slate-100 flex-row justify-between items-center"
                onPress={() => getRecipeDetail(r)}
              >
                <View className="flex-1 pr-4">
                  <View className="mb-2">
                    <Text className="font-['Nunito_800ExtraBold'] text-xl text-slate-900 leading-7">{r.title}</Text>
                  </View>

                  <Text className="font-['Nunito_400Regular'] text-[14px] text-slate-500 mb-4">{r.summary}</Text>

                  <View className="flex-row gap-2">
                    <View className="bg-slate-100 px-3 py-1.5 rounded-lg">
                      <Text className="font-['Nunito_700Bold'] text-[13px] text-slate-600">{r.time}</Text>
                    </View>
                    {r.difficulty && (
                      <View className="bg-transparent border border-slate-200 px-3 py-1.5 rounded-lg">
                        <Text className="font-['Nunito_700Bold'] text-[13px] text-slate-500">{r.difficulty}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className="w-10 h-10 rounded-full bg-blue-50 justify-center items-center">
                  <Text className="text-blue-600 text-lg">→</Text>
                </View>
              </Pressable>
            ))}
            <View className="h-28" />
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 p-6 bg-slate-50/90">
            <Pressable
              className="bg-white py-4 rounded-2xl items-center border border-slate-200 shadow-sm"
              onPress={() => {
                setAppState('SELECTING');
                contentOpacity.value = withTiming(1, { duration: 300 });
              }}
            >
              <Text className="font-['Nunito_800ExtraBold'] text-base text-slate-600">Farklı Malzemeler Seç</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {appState === 'RECIPE_DETAIL' && activeRecipe && (
        <Animated.View className="flex-1 pt-12" style={animatedContentStyle}>
          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            <Text className="font-['Nunito_900Black'] text-[32px] text-slate-900 mb-6 leading-10 tracking-tight">{activeRecipe.title}</Text>
            
            <View className="flex-row mb-8 gap-4">
              <View className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-slate-100 items-center justify-center">
                <Text className="text-2xl mb-2">⏱</Text>
                <Text className="font-['Nunito_700Bold'] text-[11px] text-slate-400 uppercase tracking-widest mb-1">HAZIRLIK</Text>
                <Text className="font-['Nunito_800ExtraBold'] text-[16px] text-slate-800">{activeRecipe.time}</Text>
              </View>
              {activeRecipe.difficulty && (
                <View className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-slate-100 items-center justify-center">
                  <Text className="text-2xl mb-2">🔥</Text>
                  <Text className="font-['Nunito_700Bold'] text-[11px] text-slate-400 uppercase tracking-widest mb-1">ZORLUK</Text>
                  <Text className="font-['Nunito_800ExtraBold'] text-[16px] text-slate-800">{activeRecipe.difficulty}</Text>
                </View>
              )}
            </View>

            {/* Ingredients Section */}
            <View className="mb-8">
              <View className="flex-row items-center mb-5">
                <Text className="text-2xl mr-2">🛒</Text>
                <Text className="font-['Nunito_900Black'] text-2xl text-slate-900">Malzemeler</Text>
              </View>
              <View className="bg-white rounded-3xl px-6 py-2 shadow-sm border border-slate-100">
                {activeRecipe.ingredientsList?.map((ing: string, idx: number) => (
                  <View key={idx} className={`flex-row items-center py-4 ${idx !== activeRecipe.ingredientsList.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <View className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-4" />
                    <Text className="font-['Nunito_700Bold'] text-[16px] text-slate-700 flex-1 leading-6">{ing.replace(/^- /, '')}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Steps Section */}
            <View className="mb-32">
              <View className="flex-row items-center mb-5">
                <Text className="text-2xl mr-2">🧑‍🍳</Text>
                <Text className="font-['Nunito_900Black'] text-2xl text-slate-900">Hazırlanışı</Text>
              </View>
              <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                {activeRecipe.steps?.map((step: string, idx: number) => {
                  // Clean up the string to remove Gemini's generic "1. Adım: " prefixes
                  const cleanStep = step.replace(/^\d+\.\s*(Adım:?|adım:?|Adım)?\s*(-)?\s*/i, '').trim();
                  return (
                    <View key={idx} className="flex-row mb-6 last:mb-0">
                      <View className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 justify-center items-center mr-4 shadow-sm shadow-blue-100/50">
                        <Text className="font-['Nunito_900Black'] text-blue-600 text-[16px]">{idx + 1}</Text>
                      </View>
                      <View className="flex-1 pt-1.5">
                        <Text className="font-['Nunito_700Bold'] text-[16px] text-slate-700 leading-7">
                          {cleanStep}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 p-6 bg-slate-50/90">
            <Pressable
              className="bg-slate-900 py-4 rounded-2xl items-center shadow-xl shadow-slate-900/20"
              onPress={() => {
                setAppState('RECIPES');
                contentOpacity.value = withTiming(1, { duration: 300 });
              }}
            >
              <Text className="font-['Nunito_800ExtraBold'] text-base text-white">Diğer Tariflere Dön</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
