export interface UserEmail {
    email: string,
    isPrimary: boolean
};

export interface UserPhone {
    phone: string
    isPrimary: boolean
};

export interface CharacterClass {
    class: string,
    level: number
};

export interface User {
    firstName: string,
    lastName: string,
    address: string,
    emails: UserEmail[],
    phoneNumbers: UserPhone[],
    class: CharacterClass
};

export interface Class {
    id: number,
    name: string
};