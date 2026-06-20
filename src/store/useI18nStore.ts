import { create } from 'zustand'

export type Language = 'tr' | 'en'

const translations: Record<Language, Record<string, any>> = {
  tr: {
    // Sidebar
    disk_analysis: 'Disk Analizi',
    select_folder: 'Klasör Seç',
    compare_folders: 'Klasör Karşılaştır',
    views: 'Görünümler',
    general_analysis: 'Genel Analiz',
    duplicate_files: 'Yinelenen Dosyalar',
    old_file_detective: 'Eski Dosya Dedektifi',
    theme: 'Tema',
    font: 'Font',
    dark: 'Koyu',
    light: 'Açık',
    scanning: 'Taranıyor...',
    files_scanned: 'dosya taranıyor...',
    files_scanned_count: 'dosya',
    quick_access: 'Hızlı Erişim',
    desktop: 'Masaüstü',
    documents: 'Belgeler',
    downloads: 'İndirilenler',
    pictures: 'Resimler',
    music: 'Müzik',
    videos: 'Videolar',
    local_disk: 'Yerel Disk (C:)',
    
    // TopBar & FolderTable
    total: 'Toplam',
    name: 'İsim',
    size: 'Boyut',
    file: 'Dosya',
    type: 'Tür',
    modified: 'Değiştirilme',
    actions: 'Eylemler',
    not_selected: 'Henüz bir klasör seçilmedi',
    empty_folder: 'Bu klasör boş',
    show_in_explorer: 'Explorer\'da Göster',
    delete: 'Sil',
    export_csv: 'CSV',
    export_json: 'JSON',
    csv_exported: 'CSV Raporu başarıyla dışa aktarıldı.',
    json_exported: 'JSON Ağaç yapısı başarıyla dışa aktarıldı.',
    delete_confirm: '"{name}" {type} Çöp Kutusu\'na taşımak istediğinizden emin misiniz?',
    folder: 'klasörünü',
    file_lower: 'dosyasını',
    file_type_map: {
      image: 'Resim',
      video: 'Video',
      audio: 'Ses',
      archive: 'Arşiv',
      code: 'Kod',
      document: 'Belge',
      executable: 'Çalıştırılabilir',
      font: 'Font',
      other: 'Diğer'
    },

    // DuplicateFinder
    duplicate_title: 'Yinelenen Dosya Bulucu',
    duplicate_desc: 'Aynı boyuttaki dosyaları bulur ve veri güvenliği için MD5 hash kontrolü ile doğrular.',
    min_size: 'Min Boyut:',
    search_placeholder: 'Dosya adı ara...',
    run_hash: 'MD5 Hash Doğrulaması Yap',
    run_hash_visible: 'Sadece Listelenenleri Doğrula',
    hashing_progress: 'Doğrulanıyor...',
    verified_badge: 'MD5 Doğrulandı',
    potential_savings: 'Potansiyel Kazanım',
    duplicate_groups: 'Yinelenen Gruplar',
    total_duplicate_files: 'Toplam Kopya Dosya',
    auto_select: 'Kopyaları Otomatik Seç (Orijinalleri Koru)',
    original: 'Orijinal',
    delete_selected: 'Seçilenleri Sil',
    selection_clear: 'Seçimi Temizle',
    delete_confirm_multi: '{count} adet dosyayı Çöp Kutusu\'na taşımak istediğinizden emin misiniz?',
    delete_error_permission: 'Bazı dosyalar silinemedi. Lütfen yönetici izinlerini veya dosya kilitlerini kontrol edin.',
    no_duplicates_found: 'Hiç yinelenen dosya bulunamadı',
    no_duplicates_sub: 'Filtreleri değiştirmeyi deneyebilirsiniz.',
    no_scan_alert_dup: 'Yinelenen dosyaları bulmak için önce bir klasör taramanız gerekmektedir.',
    more: 'Daha Fazla Göster ({count} grup kaldı)',
    waste_recoverable: 'Kurtarılabilir',
    waste_copies: 'Kopya',

    // OldFileDetective
    old_title: 'Eski/Kullanılmayan Dosya Dedektifi',
    old_desc: 'Belirli bir süredir güncellenmeyen büyük dosyaları "Dijital Toz Skoru" ile derecelendirerek listeler.',
    digital_dust_badge: 'Dijital Toz Analizi',
    inactivity_period: 'Değiştirilmediği Süre:',
    file_list_title: 'Dosya Listesi',
    dust_score_desc: 'Dijital Toz Skoru = Boyut(MB) * Yaş(Yıl). Yüksek skor = Temizleme Önceliği',
    dust_score: 'Toz Skoru',
    files_remaining: 'dosya kaldı',
    no_old_files_found: 'Kriterlere uyan eski dosya bulunamadı',
    no_old_files_sub: 'Filtreleri veya minimum boyutu düşürebilirsiniz.',
    no_scan_alert_old: 'Eski dosyaları tespit etmek için önce bir klasör taramanız gerekmektedir.',
    months_1: '> 1 Ay',
    months_3: '> 3 Ay',
    months_6: '> 6 Ay',
    year_1: '> 1 Yıl',
    years_2: '> 2 Yıl',
    dust_score_col: 'Toz Skoru',
    days_ago: '{count} gün önce',

    // CompareView
    back: 'Geri',
    folder_comparison: 'Klasör Karşılaştırma',
    left: 'Sol',
    right: 'Sağ',
    compare_summary: '{count} dosya karşılaştırıldı',
    left_folder: 'Sol Klasör (A)',
    right_folder: 'Sağ Klasör (B)',
    compare_button: 'Karşılaştır',
    cancel_button: 'İptal Et',
    reset_button: 'Sıfırla',
    comparing_in_progress: 'Karşılaştırılıyor...',
    click_to_select: 'Klasör seçmek için tıklayın',
    left_scanning: 'Sol klasör taranıyor...',
    right_scanning: 'Sağ klasör taranıyor...',
    files_scanned_label: 'Taranan dosya',
    total_files_label: 'Toplam dosya',
    total_size_label: 'Toplam boyut',
    left_scan_dot: 'Sol Tarama',
    right_scan_dot: 'Sağ Tarama',
    compare_dot: 'Karşılaştır',
    ignore_unnecessary: 'Gereksiz dosya ve klasörleri atla (node_modules, .git, vb.)',
    unscanned_files: 'Taranmayan Dosyalar',
    items_skipped: '{count} öğe atlandı',
    empty_compare_title: 'Compare iki klasörü karşılaştırarak farkları bulun',
    empty_compare_desc: 'Birebir aynı olması gereken iki klasör arasındaki eksik dosyaları, boyut farklılıklarını ve fazla dosyaları tespit edin.',
    diff_tabs: {
      all: 'Tümü',
      only_left: 'Sadece Sol',
      only_right: 'Sadece Sağ',
      size_diff: 'Boyut Farklı',
      identical: 'Aynı',
    },
    
    // ChartPanel
    chart_title: 'Boyuta Göre Dağılım',
    chart_type_title: 'Dosya Türüne Göre Dağılım',
    chart_no_data: 'Veri yok',
    only_left_badge_desc: 'Sadece Sol (A Klasörü)',
    only_right_badge_desc: 'Sadece Sağ (B Klasörü)',
    date_diff: 'Tarih Farklı',
    left_size: 'Sol Boyut',
    right_size: 'Sağ Boyut',
    difference: 'Fark',
    status: 'Durum',
    no_comparison_results: 'Filtre kriterlerine uygun sonuç bulunamadı',
    comparison_results_placeholder: 'Karşılaştırma sonuçları burada görünecek',
    files_listed_count: '{count} dosya listelendi',
    total_compare_summary: 'Toplam: {count} taranan dosya',
    path: 'Dosya Yolu',
  },
  en: {
    // Sidebar
    disk_analysis: 'Disk Analysis',
    select_folder: 'Select Folder',
    compare_folders: 'Compare Folders',
    views: 'Views',
    general_analysis: 'General Analysis',
    duplicate_files: 'Duplicate Files',
    old_file_detective: 'Old File Detective',
    theme: 'Theme',
    font: 'Font',
    dark: 'Dark',
    light: 'Light',
    scanning: 'Scanning...',
    files_scanned: 'files scanning...',
    files_scanned_count: 'files',
    quick_access: 'Quick Access',
    desktop: 'Desktop',
    documents: 'Documents',
    downloads: 'Downloads',
    pictures: 'Pictures',
    music: 'Music',
    videos: 'Videos',
    local_disk: 'Local Disk (C:)',

    // TopBar & FolderTable
    total: 'Total',
    name: 'Name',
    size: 'Size',
    file: 'File',
    type: 'Type',
    modified: 'Modified',
    actions: 'Actions',
    not_selected: 'No folder selected yet',
    empty_folder: 'This folder is empty',
    show_in_explorer: 'Show in Explorer',
    delete: 'Delete',
    export_csv: 'CSV',
    export_json: 'JSON',
    csv_exported: 'CSV Report exported successfully.',
    json_exported: 'JSON Tree structure exported successfully.',
    delete_confirm: 'Are you sure you want to move "{name}" {type} to the Recycle Bin?',
    folder: 'folder',
    file_lower: 'file',
    file_type_map: {
      image: 'Image',
      video: 'Video',
      audio: 'Audio',
      archive: 'Archive',
      code: 'Code',
      document: 'Document',
      executable: 'Executable',
      font: 'Font',
      other: 'Other'
    },

    // DuplicateFinder
    duplicate_title: 'Duplicate File Finder',
    duplicate_desc: 'Finds files with identical sizes and verifies them using MD5 hash check for data safety.',
    min_size: 'Min Size:',
    search_placeholder: 'Search file name...',
    run_hash: 'Run MD5 Hash Verification',
    run_hash_visible: 'Verify Only Listed',
    hashing_progress: 'Verifying...',
    verified_badge: 'MD5 Verified',
    potential_savings: 'Potential Savings',
    duplicate_groups: 'Duplicate Groups',
    total_duplicate_files: 'Total Duplicate Files',
    auto_select: 'Auto Select Copies (Keep Originals)',
    original: 'Original',
    delete_selected: 'Delete Selected',
    selection_clear: 'Clear Selection',
    delete_confirm_multi: 'Are you sure you want to move {count} files to the Recycle Bin?',
    delete_error_permission: 'Some files could not be deleted. Please check administrator permissions or file locks.',
    no_duplicates_found: 'No duplicate files found',
    no_duplicates_sub: 'You can try changing the filters.',
    no_scan_alert_dup: 'You must scan a folder first to find duplicate files.',
    more: 'Show More ({count} groups left)',
    waste_recoverable: 'Recoverable',
    waste_copies: 'Copies',

    // OldFileDetective
    old_title: 'Old/Unused File Detective',
    old_desc: 'Lists large files that have not been updated for a long time, ranked by "Digital Dust Score".',
    digital_dust_badge: 'Digital Dust Analysis',
    inactivity_period: 'Inactivity Period:',
    file_list_title: 'File List',
    dust_score_desc: 'Digital Dust Score = Size(MB) * Age(Years). Higher score = Higher Deletion Priority',
    dust_score: 'Dust Score',
    files_remaining: 'files left',
    no_old_files_found: 'No old files matching criteria found',
    no_old_files_sub: 'You can try lowering the filters or minimum size.',
    no_scan_alert_old: 'You must scan a folder first to detect old files.',
    months_1: '> 1 Month',
    months_3: '> 3 Months',
    months_6: '> 6 Months',
    year_1: '> 1 Year',
    years_2: '> 2 Years',
    dust_score_col: 'Dust Score',
    days_ago: '{count} days ago',

    // CompareView
    back: 'Back',
    folder_comparison: 'Folder Comparison',
    left: 'Left',
    right: 'Right',
    compare_summary: '{count} files compared',
    left_folder: 'Left Folder (A)',
    right_folder: 'Right Folder (B)',
    compare_button: 'Compare',
    cancel_button: 'Cancel',
    reset_button: 'Reset',
    comparing_in_progress: 'Comparing...',
    click_to_select: 'Click to select folder',
    left_scanning: 'Scanning left folder...',
    right_scanning: 'Scanning right folder...',
    files_scanned_label: 'Files scanned',
    total_files_label: 'Total files',
    total_size_label: 'Total size',
    left_scan_dot: 'Left Scan',
    right_scan_dot: 'Right Scan',
    compare_dot: 'Compare',
    ignore_unnecessary: 'Skip unnecessary files and folders (node_modules, .git, etc.)',
    unscanned_files: 'Unscanned Files',
    items_skipped: '{count} items skipped',
    empty_compare_title: 'Compare two folders to find differences',
    empty_compare_desc: 'Detect missing files, size differences, and extra files between two folders that should be identical.',
    diff_tabs: {
      all: 'All',
      only_left: 'Only Left',
      only_right: 'Only Right',
      size_diff: 'Size Diff',
      identical: 'Identical',
    },

    // ChartPanel
    chart_title: 'Distribution by Size',
    chart_type_title: 'Distribution by File Type',
    chart_no_data: 'No data',
    only_left_badge_desc: 'Only Left (Folder A)',
    only_right_badge_desc: 'Only Right (Folder B)',
    date_diff: 'Date Different',
    left_size: 'Left Size',
    right_size: 'Right Size',
    difference: 'Difference',
    status: 'Status',
    no_comparison_results: 'No matching comparison results found',
    comparison_results_placeholder: 'Comparison results will appear here',
    files_listed_count: '{count} files listed',
    total_compare_summary: 'Total: {count} scanned files',
    path: 'File Path',
  }
}

interface I18nStore {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, replacements?: Record<string, string | number>) => any
}

export const useI18nStore = create<I18nStore>((set, get) => ({
  language: 'tr',
  setLanguage: (language) => set({ language }),
  t: (key, replacements) => {
    const lang = get().language
    const dict = translations[lang]
    
    const keys = key.split('.')
    let result: any = dict
    for (const k of keys) {
      if (result && k in result) {
        result = result[k]
      } else {
        return key
      }
    }
    
    if (typeof result === 'string' && replacements) {
      let str = result
      Object.entries(replacements).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
      return str
    }
    
    return result
  }
}))
