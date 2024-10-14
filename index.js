const { ApolloServer, gql } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');

// Initialisation de Prisma
const prisma = new PrismaClient();

// Définition du schéma GraphQL
const typeDefs = gql`
  type Book {
    id: Int!
    title: String!
    author: Author!
    publicationDate: String!
    categories: [String!]!
  }
  
  type Author {
    id: Int!
    name: String!
    books: [Book!]!
  }

  type Query {
    books: [Book!]!
    recentBooks: [Book!]!
    authors: [Author!]!
    booksByCategory(category: String!): [Book!]!
    booksSortedByDate(order: String!): [Book!]!
  }

  type Mutation {
    addBook(title: String!, authorId: Int!, publicationDate: String!, categories: [String!]!): Book!
    addAuthor(name: String!): Author!
    updateBook(title: String!, newTitle: String, newPublicationDate: String, newCategories: [String!]): Book
    deleteBook(title: String!): String!
  }
`;

// Définition des resolvers
const resolvers = {
    Query: {
        books: async () => {
            const books = await prisma.book.findMany({
                include: { author: true },
            });
            return books.map(book => ({
                ...book,
                categories: JSON.parse(book.categories),  // Conversion JSON -> tableau
            }));
        },
        recentBooks: async () => {
            const books = await prisma.book.findMany({
                orderBy: { publicationDate: 'desc' },
                take: 2,
                include: { author: true },
            });
            return books.map(book => ({
                ...book,
                categories: JSON.parse(book.categories),  // Conversion JSON -> tableau
            }));
        },
        authors: async () => await prisma.author.findMany({
            include: { books: true },
        }),
        booksByCategory: async (_, { category }) => {
            const books = await prisma.book.findMany({
                where: { categories: { contains: category } },
                include: { author: true },
            });
            return books.map(book => ({
                ...book,
                categories: JSON.parse(book.categories),  // Conversion JSON -> tableau
            }));
        },
        booksSortedByDate: async (_, { order }) => {
            const books = await prisma.book.findMany({
                orderBy: { publicationDate: order === 'ASC' ? 'asc' : 'desc' },
                include: { author: true },
            });
            return books.map(book => ({
                ...book,
                categories: JSON.parse(book.categories),  // Conversion JSON -> tableau
            }));
        },
    },
    Mutation: {
        addBook: async (_, { title, authorId, publicationDate, categories }) => {
            const author = await prisma.author.findUnique({ where: { id: authorId } });
            if (!author) throw new Error(`Author with ID ${authorId} not found`);

            const newBook = await prisma.book.create({
                data: {
                    title,
                    publicationDate,
                    categories: JSON.stringify(categories),  // Conversion tableau -> JSON
                    author: { connect: { id: authorId } },
                },
                include: { author: true },
            });

            return {
                ...newBook,
                categories: JSON.parse(newBook.categories),  // Conversion JSON -> tableau
            };
        },
        addAuthor: async (_, { name }) => {
            return prisma.author.create({
                data: { name },
            });
        },
        updateBook: async (_, { title, newTitle, newPublicationDate, newCategories }) => {
            const updatedBook = await prisma.book.update({
                where: { title },
                data: {
                    title: newTitle || undefined,
                    publicationDate: newPublicationDate || undefined,
                    categories: newCategories ? JSON.stringify(newCategories) : undefined,  // Conversion tableau -> JSON
                },
                include: { author: true },
            });

            return {
                ...updatedBook,
                categories: JSON.parse(updatedBook.categories),  // Conversion JSON -> tableau
            };
        },
        deleteBook: async (_, { title }) => {
            await prisma.book.delete({
                where: { title },
            });
            return `Book with title "${title}" was deleted.`;
        }
    }
};

// Création du serveur Apollo
const server = new ApolloServer({ typeDefs, resolvers });

// Lancement du serveur Apollo
server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});