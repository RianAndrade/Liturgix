import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const liturgicalFunctions = [
  { name: "Microfone", description: "Responsável pelo microfone durante a celebração", displayOrder: 1 },
  { name: "Tochas", description: "Porta as tochas (velas) na liturgia", displayOrder: 2 },
  { name: "Cruz e Sino", description: "Porta a cruz processional e toca o sino", displayOrder: 3 },
  { name: "Mor", description: "Acólito principal, coordena os demais", displayOrder: 4 },
  { name: "Turiferário", description: "Porta o turíbulo (incensário)", displayOrder: 5 },
  { name: "Naveteiro", description: "Porta a naveta (recipiente de incenso)", displayOrder: 6 },
  { name: "Missal", description: "Auxilia com o missal no altar", displayOrder: 7 },
  { name: "Leitores", description: "Realiza as leituras durante a celebração", displayOrder: 8 },
];

// 30 acólitos com suas funções litúrgicas
// Rian é COORDINATOR, os demais são ACOLYTE
const acolytes: { name: string; email: string; role: Role; functions: string[] }[] = [
  { name: "Rian", email: "rianteste@teste.com", role: "COORDINATOR", functions: ["Mor", "Microfone", "Turiferário", "Cruz e Sino"] },
  { name: "Lucas Oliveira", email: "lucas.oliveira@liturgix.app", role: "ACOLYTE", functions: ["Tochas", "Microfone"] },
  { name: "Gabriel Santos", email: "gabriel.santos@liturgix.app", role: "ACOLYTE", functions: ["Cruz e Sino", "Tochas"] },
  { name: "Mateus Ferreira", email: "mateus.ferreira@liturgix.app", role: "ACOLYTE", functions: ["Turiferário", "Naveteiro"] },
  { name: "Pedro Almeida", email: "pedro.almeida@liturgix.app", role: "ACOLYTE", functions: ["Naveteiro", "Missal"] },
  { name: "João Costa", email: "joao.costa@liturgix.app", role: "ACOLYTE", functions: ["Microfone", "Leitores"] },
  { name: "Rafael Lima", email: "rafael.lima@liturgix.app", role: "ACOLYTE", functions: ["Mor", "Turiferário"] },
  { name: "André Souza", email: "andre.souza@liturgix.app", role: "ACOLYTE", functions: ["Tochas", "Cruz e Sino"] },
  { name: "Thiago Pereira", email: "thiago.pereira@liturgix.app", role: "ACOLYTE", functions: ["Missal", "Leitores"] },
  { name: "Felipe Rodrigues", email: "felipe.rodrigues@liturgix.app", role: "ACOLYTE", functions: ["Microfone", "Mor"] },
  { name: "Bruno Carvalho", email: "bruno.carvalho@liturgix.app", role: "ACOLYTE", functions: ["Turiferário", "Tochas"] },
  { name: "Daniel Martins", email: "daniel.martins@liturgix.app", role: "ACOLYTE", functions: ["Cruz e Sino", "Naveteiro"] },
  { name: "Guilherme Araújo", email: "guilherme.araujo@liturgix.app", role: "ACOLYTE", functions: ["Leitores", "Microfone"] },
  { name: "Henrique Gomes", email: "henrique.gomes@liturgix.app", role: "ACOLYTE", functions: ["Missal", "Tochas"] },
  { name: "Vinícius Ribeiro", email: "vinicius.ribeiro@liturgix.app", role: "ACOLYTE", functions: ["Naveteiro", "Turiferário"] },
  { name: "Caio Nascimento", email: "caio.nascimento@liturgix.app", role: "ACOLYTE", functions: ["Mor", "Missal"] },
  { name: "Leandro Barbosa", email: "leandro.barbosa@liturgix.app", role: "ACOLYTE", functions: ["Tochas", "Leitores"] },
  { name: "Marcos Teixeira", email: "marcos.teixeira@liturgix.app", role: "ACOLYTE", functions: ["Cruz e Sino", "Microfone"] },
  { name: "Igor Moreira", email: "igor.moreira@liturgix.app", role: "ACOLYTE", functions: ["Turiferário", "Mor"] },
  { name: "Renato Dias", email: "renato.dias@liturgix.app", role: "ACOLYTE", functions: ["Naveteiro", "Tochas"] },
  { name: "Samuel Cardoso", email: "samuel.cardoso@liturgix.app", role: "ACOLYTE", functions: ["Missal", "Cruz e Sino"] },
  { name: "Gustavo Mendes", email: "gustavo.mendes@liturgix.app", role: "ACOLYTE", functions: ["Leitores", "Turiferário"] },
  { name: "Davi Correia", email: "davi.correia@liturgix.app", role: "ACOLYTE", functions: ["Microfone", "Naveteiro"] },
  { name: "Eduardo Nunes", email: "eduardo.nunes@liturgix.app", role: "ACOLYTE", functions: ["Tochas", "Missal"] },
  { name: "Bernardo Azevedo", email: "bernardo.azevedo@liturgix.app", role: "ACOLYTE", functions: ["Mor", "Leitores"] },
  { name: "Nicolas Rocha", email: "nicolas.rocha@liturgix.app", role: "ACOLYTE", functions: ["Cruz e Sino", "Turiferário"] },
  { name: "Otávio Monteiro", email: "otavio.monteiro@liturgix.app", role: "ACOLYTE", functions: ["Naveteiro", "Microfone"] },
  { name: "Leonardo Pinto", email: "leonardo.pinto@liturgix.app", role: "ACOLYTE", functions: ["Tochas", "Mor"] },
  { name: "Murilo Castro", email: "murilo.castro@liturgix.app", role: "ACOLYTE", functions: ["Missal", "Naveteiro"] },
  { name: "Arthur Fernandes", email: "arthur.fernandes@liturgix.app", role: "ACOLYTE", functions: ["Leitores", "Cruz e Sino"] },
];

async function main() {
  console.log("Seeding liturgical functions...");

  // 1. Upsert funções litúrgicas
  for (const fn of liturgicalFunctions) {
    await prisma.liturgicalFunction.upsert({
      where: { name: fn.name },
      update: { description: fn.description, displayOrder: fn.displayOrder },
      create: fn,
    });
  }

  const validNames = liturgicalFunctions.map((fn) => fn.name);
  const deleted = await prisma.liturgicalFunction.deleteMany({
    where: { name: { notIn: validNames } },
  });

  console.log(`Seeded ${liturgicalFunctions.length} liturgical functions.`);
  if (deleted.count > 0) {
    console.log(`Removed ${deleted.count} old functions.`);
  }

  // 2. Buscar mapa de funções por nome
  const allFunctions = await prisma.liturgicalFunction.findMany();
  const fnMap = new Map(allFunctions.map((f) => [f.name, f.id]));

  // 3. Criar acólitos com suas funções
  console.log("Seeding 30 acolytes...");
  const defaultPassword = await bcrypt.hash("liturgix123", 10);

  for (const acolyte of acolytes) {
    const user = await prisma.user.upsert({
      where: { email: acolyte.email },
      update: { name: acolyte.name, role: acolyte.role },
      create: {
        name: acolyte.name,
        email: acolyte.email,
        passwordHash: defaultPassword,
        role: acolyte.role,
      },
    });

    // Vincular funções litúrgicas
    for (const fnName of acolyte.functions) {
      const functionId = fnMap.get(fnName);
      if (!functionId) {
        console.warn(`  ⚠ Função "${fnName}" não encontrada para ${acolyte.name}`);
        continue;
      }
      await prisma.userFunction.upsert({
        where: { userId_functionId: { userId: user.id, functionId } },
        update: {},
        create: { userId: user.id, functionId },
      });
    }

    const roleLabel = acolyte.role === "COORDINATOR" ? " (COORDENADOR)" : "";
    console.log(`  ✓ ${acolyte.name}${roleLabel} — ${acolyte.functions.join(", ")}`);
  }

  console.log(`\nSeeded ${acolytes.length} acolytes with their functions.`);
  console.log("Default password for all: liturgix123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
