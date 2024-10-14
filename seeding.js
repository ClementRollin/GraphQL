const { PrismaClient } = require('@prisma/client');

// Initialisation de Prisma
const prisma = new PrismaClient();

async function seedDatabase() {
    // Données des auteurs
    const authorsData = [
        { name: 'Kate Chopin' },
        { name: 'Paul Auster' },
        { name: 'Sylvia Plath' },
        { name: 'George Orwell' },
        { name: 'F. Scott Fitzgerald' },
        { name: 'ROLLIN Clément' }
    ];

    // Insérer les auteurs en évitant les doublons
    for (const authorData of authorsData) {
        const existingAuthor = await prisma.author.findUnique({
            where: { name: authorData.name }
        });

        // Si l'auteur existe déjà, on ne l'insère pas à nouveau
        if (!existingAuthor) {
            await prisma.author.create({
                data: authorData,
            });
            console.log(`Auteur ajouté : ${authorData.name}`);
        } else {
            console.log(`Auteur déjà présent : ${authorData.name}`);
        }
    }

    // Données des livres
    const booksData = [
        {
            title: 'The Awakening',
            authorName: 'Kate Chopin',
            publicationDate: '1899-04-22',
            categories: ['Fiction', 'Classics'],
        },
        {
            title: 'City of Glass',
            authorName: 'Paul Auster',
            publicationDate: '1985-03-12',
            categories: ['Fiction', 'Mystery'],
        },
        {
            title: 'The Bell Jar',
            authorName: 'Sylvia Plath',
            publicationDate: '1963-01-14',
            categories: ['Fiction', 'Autobiographical'],
        },
        {
            title: '1984',
            authorName: 'George Orwell',
            publicationDate: '1949-06-08',
            categories: ['Dystopian', 'Political Fiction'],
        },
        {
            title: 'The Great Gatsby',
            authorName: 'F. Scott Fitzgerald',
            publicationDate: '1925-04-10',
            categories: ['Fiction', 'Classics'],
        },
        {
            title: 'Les aventures de Clément',
            authorName: 'ROLLIN Clément',
            publicationDate: '2021-05-27',
            categories: ['Aventure', 'Découverte'],
        }
    ];

    // Insérer les livres en évitant les doublons
    for (const bookData of booksData) {
        const existingBook = await prisma.book.findFirst({
            where: { title: bookData.title },
        });

        // Si un livre avec ce titre existe déjà, on ne l'insère pas à nouveau
        if (!existingBook) {
            const author = await prisma.author.findUnique({
                where: { name: bookData.authorName },
            });

            if (author) {
                await prisma.book.create({
                    data: {
                        title: bookData.title,
                        publicationDate: bookData.publicationDate,
                        categories: JSON.stringify(bookData.categories),
                        author: { connect: { id: author.id } },
                    },
                });
                console.log(`Livre ajouté : ${bookData.title}`);
            } else {
                console.log(`Auteur non trouvé pour le livre : ${bookData.title}`);
            }
        } else {
            console.log(`Livre déjà présent : ${bookData.title}`);
        }
    }

    console.log('📚 Database seeded successfully!');
}

// Appel de la fonction pour peupler la base de données
seedDatabase()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });