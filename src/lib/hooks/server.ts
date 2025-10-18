// import type { Post } from './types'

// export const getPosts = async (limit: number) => {
//     const response = await fetch('https://jsonplaceholder.typicode.com/posts')
//     const data = (await response.json()) as Array<Post>
//     return data.filter((x) => x.id <= limit)
// }

// export const getPostById = async (id: number): Promise<Post> => {
//     const response = await fetch(
//         `https://jsonplaceholder.typicode.com/posts/${id}`,
//     )
//     const data = (await response.json()) as Post
//     return data
// }

export const likePost = async (postId: string) => {

}

export const unlikePost = async (postId: string) => {
    // const response = await fetch(
    //     `https://jsonplaceholder.typicode.com/posts/${id}/unlike`,
    // )
    // const data = (await response.json()) as Post
    // return data
}

export const likeComment = async (commentId: string) => {
    // const response = await fetch(
    //     `https://jsonplaceholder.typicode.com/comments/${id}/like`,
    // )
    // const data = (await response.json()) as Comment
    // return data
}

export const unlikeComment = async (commentId: string) => {
    // const response = await fetch(
    //     `https://jsonplaceholder.typicode.com/comments/${id}/unlike`,
    // )
    // const data = (await response.json()) as Comment
    // return data
}
