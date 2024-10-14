const { ApolloServer, gql } = require('apollo-server');

// Définition du schéma GraphQL
const typeDefs = gql`
  type Book {
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

// Données des livres
const books = [
    {
        title: 'The Awakening',
        authorId: 1,
        publicationDate: '1899-04-22',
        categories: ['Fiction', 'Classics'],
    },
    {
        title: 'City of Glass',
        authorId: 2,
        publicationDate: '1985-03-12',
        categories: ['Fiction', 'Mystery'],
    },
    {
        title: 'The Bell Jar',
        authorId: 3,
        publicationDate: '1963-01-14',
        categories: ['Fiction', 'Autobiographical'],
    },
    {
        title: '1984',
        authorId: 4,
        publicationDate: '1949-06-08',
        categories: ['Dystopian', 'Political Fiction'],
    },
    {
        title: 'The Great Gatsby',
        authorId: 5,
        publicationDate: '1925-04-10',
        categories: ['Fiction', 'Classics'],
    },
];

// Données des auteurs
const authors = [
    {
        id: 1,
        name: 'Kate Chopin',
    },
    {
        id: 2,
        name: 'Paul Auster',
    },
    {
        id: 3,
        name: 'Sylvia Plath',
    },
    {
        id: 4,
        name: 'George Orwell',
    },
    {
        id: 5,
        name: 'F. Scott Fitzgerald',
    },
    {
        id: 6,
        name: 'ROLLIN Clément',
    },
];

// Définition des resolvers
const resolvers = {
    Query: {
        books: () => books,
        recentBooks: () => books.slice(-2),
        authors: () => authors,
        booksByCategory: (_, { category }) =>
            books.filter(book => book.categories.includes(category)),
        booksSortedByDate: (_, { order }) => {
            return books.slice().sort((a, b) => {
                const dateA = new Date(a.publicationDate);
                const dateB = new Date(b.publicationDate);
                if (order === 'ASC') {
                    return dateA - dateB;
                } else {
                    return dateB - dateA;
                }
            });
        },
    },
    Mutation: {
        addBook: (_, { title, authorId, publicationDate, categories }) => {
            const author = authors.find(author => author.id === authorId);
            if (!author) {
                throw new Error(`Author with ID ${authorId} not found`);
            }

            const newBook = { title, authorId, publicationDate, categories };
            books.push(newBook);

            return {
                ...newBook,
                author
            };
        },
        addAuthor: (_, { name }) => {
            const newAuthor = {
                id: authors.length + 1,
                name,
            };
            authors.push(newAuthor);
            return newAuthor;
        },
        updateBook: (_, { title, newTitle, newPublicationDate, newCategories }) => {
            const book = books.find(book => book.title === title);
            if (!book) throw new Error(`Book with title "${title}" not found`);

            if (newTitle) book.title = newTitle;
            if (newPublicationDate) book.publicationDate = newPublicationDate;
            if (newCategories) book.categories = newCategories;

            return book;
        },
        deleteBook: (_, { title }) => {
            const index = books.findIndex(book => book.title === title);
            if (index === -1) throw new Error(`Book with title "${title}" not found`);

            books.splice(index, 1);
            return `Book with title "${title}" was deleted.`;
        }
    },
    Book: {
        author: ({ authorId }) => authors.find(author => author.id === authorId),
    },
    Author: {
        books: ({ id }) => books.filter(book => book.authorId === id),
    },
};

// Création du serveur Apollo
const server = new ApolloServer({ typeDefs, resolvers });

// Lancement du serveur Apollo
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});