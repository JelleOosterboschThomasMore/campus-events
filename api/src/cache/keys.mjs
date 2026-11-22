// One place that names every cached GET answer, and which writes make it outdated.
//
//   cached answer                         outdated after
//   ------------------------------------  ------------------------------------------------
//   eventList      GET /events            create / update / delete event
//   event(id)      GET /events/:id        update / delete event, new registration (spotsLeft)
//   registrations  GET /events/:id/reg.   delete event, new registration
//   stats          GET /stats             all of the above
//
// A new GET endpoint? Add its key here and list it in the services that change its data.
export const cacheKeys = {
  eventList: 'events:list',
  event: (id) => `events:item:${id}`,
  registrations: (id) => `events:registrations:${id}`,
  stats: 'stats'
};
