export interface Task{
    id:number | string,
    title: string,
    description: string,
    image?: string,
    isCompleted: boolean
}

export interface Card{
    id: number | string,
    title: string,
    description: string,
    tasks: Task[],
    position: number,
    color:string
}

export interface List {
	id: number | string,
	title: string,
	cardIds: (number | string)[],
	position: number,
    color: string
}

export interface Board {
	id: number | string;
	title: string;
	description: string;
	lists: List[];
}