import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExcelQuestion {
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  image_url?: string;
}

export interface ExcelQuizData {
  title?: string;
  description?: string;
  category?: string;
  language?: string;
  questions: ExcelQuestion[];
}

// Template data untuk Excel
const templateData = [
  {
    'No': 1,
    'Pertanyaan': 'Siapa presiden pertama Indonesia?',
    'Jawaban A': 'Soekarno',
    'Jawaban B': 'Soeharto', 
    'Jawaban C': 'Habibie',
    'Jawaban D': 'Megawati',
    'Jawaban Benar': 'A',
    'URL Gambar': ''
  },
  {
    'No': 2,
    'Pertanyaan': 'Kapan Indonesia merdeka?',
    'Jawaban A': '17 Agustus 1944',
    'Jawaban B': '17 Agustus 1945',
    'Jawaban C': '17 Agustus 1946',
    'Jawaban D': '17 Agustus 1947',
    'Jawaban Benar': 'B',
    'URL Gambar': ''
  },
  {
    'No': 3,
    'Pertanyaan': 'Apa nama lagu kebangsaan Indonesia?',
    'Jawaban A': 'Indonesia Raya',
    'Jawaban B': 'Garuda Pancasila',
    'Jawaban C': 'Bagimu Negeri',
    'Jawaban D': 'Ibu Pertiwi',
    'Jawaban Benar': 'A',
    'URL Gambar': ''
  }
];

// Metadata template
const metadataTemplate = [
  {
    'Field': 'Judul Quiz',
    'Value': 'Quiz Sejarah Indonesia'
  },
  {
    'Field': 'Deskripsi',
    'Value': 'Quiz tentang sejarah Indonesia untuk siswa SMA'
  },
  {
    'Field': 'Kategori',
    'Value': 'history'
  },
  {
    'Field': 'Bahasa',
    'Value': 'id'
  }
];

export function downloadExcelTemplate() {
  try {
    // Buat workbook baru
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Instruksi
    const instructionsData = [
      ['TEMPLATE IMPORT QUIZ EXCEL'],
      [''],
      ['CARA PENGGUNAAN:'],
      ['1. Isi data quiz pada sheet "Quiz Data"'],
      ['2. Isi metadata quiz pada sheet "Metadata" (opsional)'],
      ['3. Simpan file Excel'],
      ['4. Upload file di halaman buat quiz'],
      [''],
      ['CATATAN PENTING:'],
      ['• Jangan ubah nama kolom di header'],
      ['• Jawaban Benar harus berupa A, B, C, atau D'],
      ['• URL Gambar opsional (kosongkan jika tidak ada)'],
      ['• Minimal 5 pertanyaan untuk quiz yang valid'],
      [''],
      ['KATEGORI YANG TERSEDIA:'],
      ['general, science, math, history, geography, language, technology, sports, entertainment, business'],
      [''],
      ['BAHASA YANG TERSEDIA:'],
      ['id (Indonesia), en (English)']
    ];
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    
    // Set column widths untuk instruksi
    instructionsSheet['!cols'] = [
      { width: 80 }
    ];
    
    // Sheet 2: Quiz Data
    const quizDataSheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths untuk quiz data
    quizDataSheet['!cols'] = [
      { width: 5 },   // No
      { width: 50 },  // Pertanyaan
      { width: 25 },  // Jawaban A
      { width: 25 },  // Jawaban B
      { width: 25 },  // Jawaban C
      { width: 25 },  // Jawaban D
      { width: 15 },  // Jawaban Benar
      { width: 30 }   // URL Gambar
    ];
    
    // Sheet 3: Metadata
    const metadataSheet = XLSX.utils.json_to_sheet(metadataTemplate);
    
    // Set column widths untuk metadata
    metadataSheet['!cols'] = [
      { width: 20 },  // Field
      { width: 50 }   // Value
    ];
    
    // Tambahkan sheets ke workbook
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instruksi');
    XLSX.utils.book_append_sheet(workbook, quizDataSheet, 'Quiz Data');
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
    
    // Convert ke binary
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true
    });
    
    // Download file
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const fileName = `Template_Quiz_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating Excel template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Interface untuk data quiz yang akan diekspor
export interface ExportQuestion {
  id: string;
  question_text: string;
  image_url: string | null;
  answers: Array<{
    id: string;
    answer_text: string;
    is_correct: boolean;
    color: string;
    image_url: string | null;
  }>;
}

export interface ExportQuizData {
  title: string;
  description?: string;
  category: string;
  language: string;
  questions: ExportQuestion[];
}

export function exportQuestionsToExcel(quizData: ExportQuizData) {
  try {
    // Transform questions ke format Excel
    const excelQuestions = quizData.questions.map((question, index) => {
      // Cari jawaban yang benar
      const correctAnswerIndex = question.answers.findIndex(a => a.is_correct);
      const correctAnswerLetter = String.fromCharCode(65 + correctAnswerIndex); // A, B, C, D
      
      return {
        'No': index + 1,
        'Pertanyaan': question.question_text,
        'Jawaban A': question.answers[0]?.answer_text || '',
        'Jawaban B': question.answers[1]?.answer_text || '',
        'Jawaban C': question.answers[2]?.answer_text || '',
        'Jawaban D': question.answers[3]?.answer_text || '',
        'Jawaban Benar': correctAnswerLetter,
        'URL Gambar': question.image_url || ''
      };
    });

    // Metadata untuk quiz
    const metadata = [
      {
        'Field': 'Judul Quiz',
        'Value': quizData.title
      },
      {
        'Field': 'Deskripsi',
        'Value': quizData.description || ''
      },
      {
        'Field': 'Kategori',
        'Value': quizData.category
      },
      {
        'Field': 'Bahasa',
        'Value': quizData.language
      }
    ];

    // Buat workbook baru
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Instruksi
    const instructionsData = [
      ['EXPORT QUIZ EXCEL'],
      [''],
      ['File ini berisi soal-soal quiz yang telah dibuat.'],
      ['Anda dapat mengedit soal dan mengimport kembali.'],
      [''],
      ['CARA MENGEDIT:'],
      ['1. Edit data pada sheet "Quiz Data"'],
      ['2. Edit metadata pada sheet "Metadata" jika diperlukan'],
      ['3. Simpan file Excel'],
      ['4. Import kembali di halaman buat quiz'],
      [''],
      ['CATATAN PENTING:'],
      ['• Jangan ubah nama kolom di header'],
      ['• Jawaban Benar harus berupa A, B, C, atau D'],
      ['• URL Gambar opsional (kosongkan jika tidak ada)'],
      ['• Minimal 5 pertanyaan untuk quiz yang valid'],
      [''],
      [`Total Pertanyaan: ${excelQuestions.length}`],
      [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`]
    ];
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    
    // Set column widths untuk instruksi
    instructionsSheet['!cols'] = [
      { width: 80 }
    ];
    
    // Sheet 2: Quiz Data
    const quizDataSheet = XLSX.utils.json_to_sheet(excelQuestions);
    
    // Set column widths untuk quiz data
    quizDataSheet['!cols'] = [
      { width: 5 },   // No
      { width: 50 },  // Pertanyaan
      { width: 25 },  // Jawaban A
      { width: 25 },  // Jawaban B
      { width: 25 },  // Jawaban C
      { width: 25 },  // Jawaban D
      { width: 15 },  // Jawaban Benar
      { width: 30 }   // URL Gambar
    ];
    
    // Sheet 3: Metadata
    const metadataSheet = XLSX.utils.json_to_sheet(metadata);
    
    // Set column widths untuk metadata
    metadataSheet['!cols'] = [
      { width: 20 },  // Field
      { width: 50 }   // Value
    ];
    
    // Tambahkan sheets ke workbook
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instruksi');
    XLSX.utils.book_append_sheet(workbook, quizDataSheet, 'Quiz Data');
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
    
    // Convert ke binary
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true
    });
    
    // Download file
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Buat nama file yang safe untuk filesystem
    const safeTitle = quizData.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const fileName = `Quiz_${safeTitle}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function parseExcelFile(file: File): Promise<ExcelQuizData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Parse Quiz Data sheet
        const quizSheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('quiz') || name.toLowerCase().includes('data')
        ) || workbook.SheetNames[0];
        
        const quizSheet = workbook.Sheets[quizSheetName];
        const quizData = XLSX.utils.sheet_to_json(quizSheet);
        
        // Parse Metadata sheet (optional)
        let metadata: any = {};
        const metadataSheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('metadata') || name.toLowerCase().includes('meta')
        );
        
        if (metadataSheetName) {
          const metadataSheet = workbook.Sheets[metadataSheetName];
          const metadataArray = XLSX.utils.sheet_to_json(metadataSheet) as any[];
          
          metadataArray.forEach((row: any) => {
            const field = row['Field'] || row['field'] || Object.keys(row)[0];
            const value = row['Value'] || row['value'] || Object.values(row)[1];
            
            if (field && value) {
              switch (field.toLowerCase()) {
                case 'judul quiz':
                case 'title':
                  metadata.title = value;
                  break;
                case 'deskripsi':
                case 'description':
                  metadata.description = value;
                  break;
                case 'kategori':
                case 'category':
                  metadata.category = value;
                  break;
                case 'bahasa':
                case 'language':
                  metadata.language = value;
                  break;
              }
            }
          });
        }
        
        // Validate and transform quiz data
        const questions: ExcelQuestion[] = [];
        
        for (let i = 0; i < quizData.length; i++) {
          const row = quizData[i] as any;
          
          // Skip empty rows
          if (!row || Object.keys(row).length === 0) continue;
          
          // Get question text (flexible column names)
          const questionText = row['Pertanyaan'] || row['Question'] || row['pertanyaan'] || row['question'];
          if (!questionText || questionText.toString().trim() === '') {
            throw new Error(`Baris ${i + 2}: Pertanyaan tidak boleh kosong`);
          }
          
          // Time limit tidak diperlukan lagi
          
          // Get answers
          const answerA = row['Jawaban A'] || row['Answer A'] || row['A'] || '';
          const answerB = row['Jawaban B'] || row['Answer B'] || row['B'] || '';
          const answerC = row['Jawaban C'] || row['Answer C'] || row['C'] || '';
          const answerD = row['Jawaban D'] || row['Answer D'] || row['D'] || '';
          
          if (!answerA.toString().trim() || !answerB.toString().trim() || 
              !answerC.toString().trim() || !answerD.toString().trim()) {
            throw new Error(`Baris ${i + 2}: Semua jawaban (A, B, C, D) harus diisi`);
          }
          
          // Get correct answer
          const correctAnswer = (row['Jawaban Benar'] || row['Correct Answer'] || row['correct'] || '').toString().toUpperCase();
          if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
            throw new Error(`Baris ${i + 2}: Jawaban benar harus A, B, C, atau D`);
          }
          
          // Get image URL (optional)
          const imageUrl = row['URL Gambar'] || row['Image URL'] || row['image_url'] || '';
          
          questions.push({
            question_text: questionText.toString().trim(),
            answer_a: answerA.toString().trim(),
            answer_b: answerB.toString().trim(),
            answer_c: answerC.toString().trim(),
            answer_d: answerD.toString().trim(),
            correct_answer: correctAnswer as 'A' | 'B' | 'C' | 'D',
            image_url: imageUrl.toString().trim() || undefined
          });
        }
        
        if (questions.length === 0) {
          throw new Error('Tidak ada pertanyaan yang valid ditemukan dalam file Excel');
        }
        
        if (questions.length < 5) {
          throw new Error(`Quiz harus memiliki minimal 5 pertanyaan. Ditemukan: ${questions.length} pertanyaan`);
        }
        
        resolve({
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          language: metadata.language,
          questions
        });
        
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Error parsing Excel file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}