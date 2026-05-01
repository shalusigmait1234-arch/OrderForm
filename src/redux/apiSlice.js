import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:5001/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Order', 'Customer', 'User'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Existing endpoints
    checkCustomer: builder.query({
      query: (name) => `/customers/check/${name}`,
      providesTags: ['Customer'],
    }),
    getCustomerOrders: builder.query({
      query: (name) => `/orders/customer/${name}`,
      providesTags: (result, error, name) => [{ type: 'Order', id: name }],
    }),
    createOrder: builder.mutation({
      query: (newOrder) => ({
        url: '/orders',
        method: 'POST',
        body: newOrder,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }, 'Customer'],
    }),
    recordPayment: builder.mutation({
      query: ({ id, ...paymentData }) => ({
        url: `/orders/${id}/payment`,
        method: 'PATCH',
        body: paymentData,
      }),
      invalidatesTags: (result, error, { customerName }) => [
        { type: 'Order', id: customerName },
        { type: 'Order', id: 'LIST' },
      ],
    }),
    getAllOrders: builder.query({
      query: () => '/orders',
      providesTags: (result) => 
        result 
          ? [...result.orders.map(({ _id }) => ({ type: 'Order', id: _id })), { type: 'Order', id: 'LIST' }]
          : [{ type: 'Order', id: 'LIST' }],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetUsersQuery,
  useDeleteUserMutation,
  useCheckCustomerQuery,
  useLazyCheckCustomerQuery,
  useGetCustomerOrdersQuery,
  useLazyGetCustomerOrdersQuery,
  useCreateOrderMutation,
  useRecordPaymentMutation,
  useGetAllOrdersQuery,
} = apiSlice;
