const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const { PDFDocument, rgb } = require("pdf-lib");
const quizTemplateQuestions = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "quizTemplateQuestions.csv"
);
const pdfCardsQuestions = path.join(__dirname, "..", "pdf");
const nomeDoJogo = "Jogo Torta na Cara";

// Definindo as margens em pontos (convertido de cm para pontos)
const marginTop = 26.7; // 3 cm em pontos
const marginBottom = 26.7; // 2 cm em pontos
const marginLeft = 26.7; // 3 cm em pontos
const marginRight = 26.7; // 2 cm em pontos

// Definindo o tamanho da página (10 cm x 15 cm em pontos)
const pageWidth = 425.2; // 10 cm em pontos
const pageHeight = 283.46; // 15 cm em pontos

async function createPDF(id, question, answers, correctAnswer, index) {
  const pdfDoc = await PDFDocument.create();

  // Adicionando a página com o tamanho definido
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Área disponível para o conteúdo
  const contentWidth = pageWidth - marginLeft - marginRight;
  const contentHeight = pageHeight - marginTop - marginBottom;

  const maxContentWidth = contentWidth - 10;
  const fontSize = 12;

  // Desenhando o retângulo no limite das margens
  page.drawRectangle({
    x: marginLeft,
    y: marginBottom,
    width: contentWidth,
    height: contentHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1, // Espessura da borda
  });

  // Content layout
  const textX = marginLeft * 1.5;
  let textY = contentHeight + 14; // Starting height for the text

  // Adicionando o título dentro do retângulo
  page.drawText(nomeDoJogo, {
    x: contentWidth / 2 - nomeDoJogo.length,
    y: textY,
    size: fontSize,
    lineHeight: 14,
    color: rgb(0, 0, 0),
    maxWidth: maxContentWidth, // Respeitar a largura disponível
  });

  textY -= 30;

  // Adicionando a pergunta dentro do retângulo
  page.drawText(`Pergunta ${id}: ${question}`, {
    x: textX,
    y: textY,
    size: fontSize,
    lineHeight: 14,
    color: rgb(0, 0, 0),
    maxWidth: maxContentWidth, // Respeitar a largura disponível
  });

  textY -= 40;

  // Adicionando as alternativas
  answers.forEach((answer, i) => {
    page.drawText(`Alternativa ${i + 1}: ${answer}`, {
      x: textX,
      y: textY,
      size: fontSize,
      lineHeight: 14,
      color: rgb(0, 0, 0),
      maxWidth: maxContentWidth, // Respeitar a largura disponível
    });
    textY -= 30;
  });

  textY -= 10;
  // Adicionando a resposta correta
  page.drawText(`Resposta Correta: ${correctAnswer}`, {
    x: textX,
    y: textY,
    size: fontSize,
    lineHeight: 14,
    color: rgb(0, 0, 0.8),
    maxWidth: maxContentWidth, // Respeitar a largura disponível
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(
    `${pdfCardsQuestions}/question-${index.toString().padStart(2, "0")}.pdf`,
    pdfBytes
  );
}

async function processCSV() {
  const questions = [];

  fs.createReadStream(quizTemplateQuestions)
    .pipe(csv({ separator: ";" }))
    .on("data", (row) => {
      const id = row.id;
      const question = row.question;
      const answers = [row.answer1, row.answer2, row.answer3, row.answer4];
      const correctAnswer = parseInt(row.correctAnswer); // Certificando-se de que é um número inteiro
      questions.push({ id, question, answers, correctAnswer });
    })
    .on("end", async () => {
      console.log(
        `CSV file successfully processed ${questions.length} questions.`
      );

      // Embaralha todas as questões após ler o arquivo CSV
      const shuffledQuestions = questions.map(shuffle_answers);
      console.log("Questões embaralhadas com sucesso!");

      for (let i = 0; i < questions.length; i++) {
        const { id, question, answers, correctAnswer } = questions[i];
        await createPDF(id, question, answers, correctAnswer, i + 1);
      }
      console.log("PDF cards created successfully!");
    });
}

// Função para embaralhar as respostas e atualizar a posição da resposta correta
function shuffle_answers(question) {
  // Armazenar as respostas em um array
  let answers = [...question.answers]; // Fazemos uma cópia das respostas para não alterar o original diretamente

  // Posição da resposta correta (ajustada para índice 0)
  let correctAnswerIndex = question.correctAnswer - 1;

  // Embaralhar as respostas usando o método Fisher-Yates (Knuth shuffle)
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]]; // Trocar as posições
  }

  // Encontrar a nova posição da resposta correta após o embaralhamento
  let newCorrectAnswerIndex = answers.indexOf(
    question.answers[correctAnswerIndex]
  );

  // Atualizar a posição da resposta correta
  question.correctAnswer = newCorrectAnswerIndex + 1; // Ajustando para índice 1

  // Atualizar as respostas no objeto question
  question.answers = answers;

  return question;
}

processCSV();
