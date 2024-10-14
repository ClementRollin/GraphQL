const { ApolloServer, gql } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');
const DataLoader = require('dataloader');

// Initialisation de Prisma
const prisma = new PrismaClient();

// Création d'un DataLoader pour charger les auteurs en lot
const authorLoader = new DataLoader(async (authorIds) => {
    const authors = await prisma.author.findMany({
        where: { id: { in: authorIds } },
    });

    return authorIds.map(authorId => authors.find(author => author.id === authorId));
});

// Création d'un DataLoader pour charger les livres en lot
const bookLoader = new DataLoader(async (bookIds) => {
    const books = await prisma.book.findMany({
        where: { id: { in: bookIds } },
    });

    return bookIds.map(bookId => books.find(book => book.id === bookId));
});

// Création d'un DataLoader pour charger les livres par auteur
const booksByAuthorLoader = new DataLoader(async (authorIds) => {
    const books = await prisma.book.findMany({
        where: { authorId: { in: authorIds } },
    });

    return authorIds.map(authorId => books.filter(book => book.authorId === authorId));
});

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
        books: async (_, __, { bookLoader }) => {
            const books = await prisma.book.findMany();
            return books.map(book => ({
                ...book,
                categories: JSON.parse(book.categories),
            }));
        },
        recentBooks: async (_, __, { bookLoader }) => {
            const books = await prisma.book.findMany({
                orderBy: { publicationDate: 'desc' },
                take: 2,
            });
            return books.map(book => ({
                ...book,
                categories: JSON.parse(book.categories),
            }));
        },
        authors: async (_, __, { authorLoader }) => {
            const authors = await prisma.author.findMany();
            return authors;
        },
        booksByCategory: async (_, { category }, { bookLoader }) => {
            const books = await prisma.book.findMany({
                where: { categories: { contains: category } },
            });
            return books.map(book => ({
                ...book,
                categories: JSON.parse(book.categories),
            }));
        },
        booksSortedByDate: async (_, { order }, { bookLoader }) => {
            const books = await prisma.book.findMany({
                orderBy: { publicationDate: order === 'ASC' ? 'asc' : 'desc' },
            });
            return books.map(book => ({
                ...book,
                categories: JSON.parse(book.categories),
            }));
        },
    },
    Mutation: {
        addBook: async (_, { title, authorId, publicationDate, categories }, { authorLoader }) => {
            const newBook = await prisma.book.create({
                data: {
                    title,
                    publicationDate,
                    categories: JSON.stringify(categories),
                    author: { connect: { id: authorId } },
                },
            });

            return {
                ...newBook,
                categories: JSON.parse(newBook.categories),
            };
        },
        addAuthor: async (_, { name }) => {
            return prisma.author.create({
                data: { name },
            });
        },
        updateBook: async (_, { title, newTitle, newPublicationDate, newCategories }, { bookLoader }) => {
            const updatedBook = await prisma.book.update({
                where: { title },
                data: {
                    title: newTitle || undefined,
                    publicationDate: newPublicationDate || undefined,
                    categories: newCategories ? JSON.stringify(newCategories) : undefined,
                },
            });

            return {
                ...updatedBook,
                categories: JSON.parse(updatedBook.categories),
            };
        },
        deleteBook: async (_, { title }, { bookLoader }) => {
            await prisma.book.delete({
                where: { title },
            });
            return `Book with title "${title}" was deleted.`;
        }
    },
    Book: {
        // Utilisation du DataLoader pour résoudre l'auteur en une seule requête pour plusieurs livres
        author: (book, _, { authorLoader }) => authorLoader.load(book.authorId),
    },
    Author: {
        // Utilisation de DataLoader pour charger les livres d'un auteur en une seule requête
        books: (author, _, { booksByAuthorLoader }) => booksByAuthorLoader.load(author.id),
    }
};

// Création du serveur Apollo
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({
        authorLoader,
        bookLoader,
        booksByAuthorLoader,
    }),
});

// Lancement du serveur Apollo
server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});