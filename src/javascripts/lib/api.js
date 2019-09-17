export function getTicketData(ticketId) {
    return {
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'GET',
        dataType: 'json'
    }
}
