# 📁 DiskDetective Pro — Klasör Boyutu Analizi & Disk Temizleme Aracı

Windows için geliştirilmiş, disk kullanımını derinlemesine analiz eden, gereksiz dosyaları temizleyen ve klasörleri karşılaştıran profesyonel bir masaüstü uygulaması. 

**Teknik Stack:** Electron 33+ (frameless pencere) · React 18 · TypeScript · Vite 5 · Tailwind CSS · shadcn/ui · Recharts · Zustand · electron-builder

---

## 🚀 Öne Çıkan Yeni Özellikler — New Pro Features

### 1. 🔍 Yinelenen (Duplikat) Dosya Bulucu
- **Akıllı MD5 Hashing:** Boyut eşleşmesi olan dosyaları Electron arka planında (stream bazlı, 5'li paralel paketlerle) MD5 doğrulamasından geçirir. İçeriği %100 aynı olan dosyaları gruplar.
- **Otomatik Seçim (Kopyaları Seç):** Orijinal dosyaları koruyarak kopyaları tek tıkla silinmek üzere otomatik seçer.
- **Kısmi MD5 Doğrulaması:** Büyük taranan klasörlerde performans kazanımı sağlamak için sadece o anda ekranda listelenmiş olan aday grupların MD5 hash'lerini doğrular ("Sadece Listelenenleri Doğrula" butonu).
- **Filtreler:** Dosya adı arama (300ms debounced) ve minimum boyut sınırlaması.

### 2. 👻 Eski/Kullanılmayan Dosya Dedektifi
- **Dijital Toz Skoru:** Dosyaların boyutu ile değiştirilmedikleri süreyi çarparak `Boyut(MB) * (Geçen Gün / 365)` formülüyle "Dijital Toz Skoru" hesaplar ve temizleme önceliğini belirler.
- **Zaman Filtreleri:** >1 Ay, >3 Ay, >6 Ay, >1 Yıl, >2 Yıl seçenekleriyle kullanılmayan büyük dosyaları listeler.

### 3. 🗑️ Uygulama İçi Güvenli Silme (Çöp Kutusu Entegrasyonu)
- **Güvenli Silme:** Electron `shell.trashItem` entegrasyonuyla dosyalar doğrudan silinmez, işletim sisteminin Geri Dönüşüm Kutusu'na gönderilir.
- **Reaktif Boyut Güncellemesi:** Bir dosya silindiğinde, re-scan yapmaya gerek kalmadan tüm üst klasörlerin (ancestors) dosya sayıları ve boyutları anlık olarak bellek üzerinde güncellenir.

### 4. 📊 Karşılaştırma Ekranı (CompareView)
- **Klasör Karşılaştırma (A vs B):** İki klasörü yan yana tarayıp karşılaştırır.
- **Farkların Tespiti:** Sadece Sol Klasörde (A) olanlar, Sadece Sağda (B) olanlar, Boyut Farklılıkları, Tarih Farklılıkları ve Aynı olan dosyaları gruplar.
- **İlerleme Göstergesi:** Tarama adımlarını (Sol Klasör, Sağ Klasör, Karşılaştırma) ve atlanan/taranmayan dosyaları (örn: `node_modules`, `.git`) listeler.

### 5. 🌐 i18n Çoklu Dil Desteği (Turkish / English)
- **Zustand Tabanlı Çeviri:** React-i18next gibi harici ağır kütüphaneler yerine, Zustand üzerinde geliştirilmiş hızlı ve dinamik dil mağazası (`useI18nStore.ts`).
- Uygulamadaki tüm grafikler, veri tabloları, menüler ve uyarılar runtime'da anında Türkçe ve İngilizce dilleri arasında geçiş yapabilir.

---

## 🚀 Hızlı Başlangıç — Quick Start

```bash
# Bağımlılıkları yükle — Install dependencies
npm install

# Geliştirme modu — Development mode (Vite HMR + Electron)
npm run dev

# Derleme — Build (TypeScript + Vite)
npm run build

# Windows kurulum paketi — Windows installer (NSIS)
npm run package
```

---

## 🔧 Teknik Stack — Tech Stack

| Bileşen | Teknoloji |
|---------|-----------|
| **Shell** | Electron 33+ (frameless pencere) |
| **UI Framework** | React 18 + Vite 5 + TypeScript |
| **CSS & Stil** | Tailwind CSS v3 + shadcn/ui (Sleek Dark/Light modları) |
| **Grafik / Charts** | Recharts (Pie, Bar) |
| **Durum Yönetimi (State)**| Zustand (Hafif ve hızlı reaktif state) |
| **Silme Motoru** | `shell.trashItem` (Sistem Çöp Kutusu entegrasyonu) |
| **Dışa Aktarma** | CSV (Flat Dosya Listesi UTF-8 BOM) & JSON (Hiyerarşik Ağaç Yapısı) |
| **Build Sürümü** | electron-builder (NSIS Installer) |

---

## 📂 Proje Yapısı — Project Structure

```
folder-analyzer/
├── electron/
│   ├── main.ts           # Electron ana süreç, IPC handler'ları (delete, export, hash)
│   ├── preload.ts        # Güvenli IPC köprüsü (openInExplorer, selectFolder vb.)
│   └── scanner.ts        # Klasör tarama motoru
├── src/
│   ├── App.tsx           # Ana düzenleyici (Analyzer, Duplicates, Old Files, Compare views)
│   ├── main.tsx          # React giriş noktası
│   ├── store/
│   │   ├── useFolderStore.ts   # Klasör ağacı, tema ve yazı boyutu yönetimi
│   │   ├── useCompareStore.ts  # Klasör karşılaştırma durumu ve verileri
│   │   └── useI18nStore.ts     # TR/EN dil çeviri yönetimi (Zustand)
│   ├── components/
│   │   ├── layout/       # TitleBar, Sidebar, TopBar (Dil/Tema Seçiciler)
│   │   ├── ui/           # Custom UI bileşenleri (Button, Table, ScrollArea)
│   │   ├── FolderTree.tsx      # Klasör ağacı hiyerarşisi
│   │   ├── FolderTable.tsx     # Klasör içi dosya listesi (Silme/Açma hızlı eylemleri)
│   │   ├── ChartPanel.tsx      # Dosya boyut/tür dağılım grafikleri
│   │   ├── DuplicateFinder.tsx # Yinelenen dosya bulucu ekranı
│   │   ├── OldFileDetective.tsx# Eski dosya tespit ekranı
│   │   ├── CompareView.tsx     # Klasör karşılaştırma paneli
│   │   ├── DiffSummary.tsx     # Karşılaştırma grafik ve özet istatistik kartları
│   │   └── DiffTable.tsx       # Karşılaştırma detaylı dosya ağaç tablosu
│   ├── themes/           # CSS Custom Properties tabanlı koyu/açık temalar
│   └── lib/utils.ts      # formatBytes, formatDuration, getFileIcon yardımcıları
```

---

## ✨ Tüm Özellikler — Feature Map

| Özellik | Açıklama |
|---------|----------|
| **Klasör Tarama** | Rekürsif, Promise.all ile paralel. 300ms throttle ile arayüzü kilitlemeyen ilerleme bildirimi. |
| **Grafikler** | Donut grafik (boyut dağılımı) + Yatay Bar grafik (dosya türü) |
| **Sıralama** | Tüm tablolarda sütun başlığına tıklayarak anlık asc/desc sıralama. |
| **Çoklu Dil (i18n)** | Türkçe ve İngilizce dilleri arasında anında geçiş. |
| **Tema Seçenekleri** | Koyu (Dark) ve Açık (Light) modern minimalist temalar. |
| **Yazı Boyutu Ayarı** | 11px ile 18px arasında güvenli sınırlanmış (clamped) yazı boyutu. Limitlerde A+/A- butonları otomatik devre dışı kalır. |
| **Katlanabilir Paneller** | Klasör ağacı ve Sidebar tek tıkla gizlenebilir/açılabilir. |
| **Breadcrumb Navigasyonu**| Taranan yolda geriye dönük hızlı tıklanabilir klasör breadcrumb'ı. |
| **Hızlı Erişim** | Masaüstü, Belgeler, İndirilenler gibi sistem klasörlerine tek tıkla tarama başlatma. |
| **Rapor Dışa Aktarma** | Klasör yapısını JSON, düz dosya listesini ise UTF-8 BOM destekli CSV olarak dışa aktarma. |
| **Gelişmiş Arayüz (Layout)**| Recharts kartları arasındaki katmanlı sınır sorunları (Double Card Layering) çözülmüş premium görünüm. |

---

## ⌨️ Geliştirme Komutları — Dev Commands

```bash
npm run dev          # Geliştirme modunu başlatır (Vite HMR + Electron)
npm run build        # TypeScript ve Vite ile üretim paketini derler
npm run preview      # Derlenmiş üretim sürümünü önizler
npm run package      # Windows için kurulum paketi (NSIS .exe) üretir
npm run package:dir  # Paketlemeyi kurulum yapmadan dizin olarak çıktı verir
```

---

## 📄 Lisans — License

MIT
