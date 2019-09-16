export function getUsers(userIds) {
    return {
        url = `/api/v2/users/show_many.json?ids=${userIds.join(',')}&include=organizations,groups`,
        type: 'GET',
        dataType: 'json'
    }
}

export function getTicketData(ticketId) {
    return { 
        url: `/api/v2/tickets/${id}.json`,
        type: 'GET',
        dataType: 'json'
    }
}