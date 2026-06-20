// Tipos do schema do Supabase (MINI VAT PREMIUM).
// Escritos a mao a partir de docs/05-DATABASE-SCHEMA.md / migration 0001.
// Quando houver acesso ao Supabase CLI, regenerar com:
//   pnpm supabase gen types typescript --project-id vuvoqmfmxcqqmkzthkjx > src/lib/supabase/types.ts
// Mantenha em sincronia ao adicionar novas migrations.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          cpf: string | null
          phone: string | null
          role: Database['public']['Enums']['user_role']
          marketing_opt_in: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          cpf?: string | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          marketing_opt_in?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          cpf?: string | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          marketing_opt_in?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          type: Database['public']['Enums']['address_type']
          recipient_name: string
          cep: string
          street: string
          number: string
          complement: string | null
          neighborhood: string
          city: string
          state: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: Database['public']['Enums']['address_type']
          recipient_name: string
          cep: string
          street: string
          number: string
          complement?: string | null
          neighborhood: string
          city: string
          state: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: Database['public']['Enums']['address_type']
          recipient_name?: string
          cep?: string
          street?: string
          number?: string
          complement?: string | null
          neighborhood?: string
          city?: string
          state?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          parent_id: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          seo_title: string | null
          seo_description: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          sku: string
          slug: string
          name: string
          short_description: string | null
          description: string | null
          category_id: string | null
          brand: string | null
          price_cents: number
          compare_at_price_cents: number | null
          cost_cents: number | null
          stock: number
          low_stock_threshold: number
          weight_g: number
          width_cm: number
          height_cm: number
          length_cm: number
          is_active: boolean
          is_featured: boolean
          requires_shipping: boolean
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          search_tsv: unknown | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          sku: string
          slug: string
          name: string
          short_description?: string | null
          description?: string | null
          category_id?: string | null
          brand?: string | null
          price_cents: number
          compare_at_price_cents?: number | null
          cost_cents?: number | null
          stock?: number
          low_stock_threshold?: number
          weight_g?: number
          width_cm?: number
          height_cm?: number
          length_cm?: number
          is_active?: boolean
          is_featured?: boolean
          requires_shipping?: boolean
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          sku?: string
          slug?: string
          name?: string
          short_description?: string | null
          description?: string | null
          category_id?: string | null
          brand?: string | null
          price_cents?: number
          compare_at_price_cents?: number | null
          cost_cents?: number | null
          stock?: number
          low_stock_threshold?: number
          weight_g?: number
          width_cm?: number
          height_cm?: number
          length_cm?: number
          is_active?: boolean
          is_featured?: boolean
          requires_shipping?: boolean
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt_text: string | null
          sort_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string
          name: string
          options: Json
          price_cents: number | null
          stock: number
          weight_g: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          sku: string
          name: string
          options?: Json
          price_cents?: number | null
          stock?: number
          weight_g?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          sku?: string
          name?: string
          options?: Json
          price_cents?: number | null
          stock?: number
          weight_g?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          customer_email: string
          customer_name: string
          customer_cpf: string | null
          customer_phone: string | null
          status: Database['public']['Enums']['order_status']
          subtotal_cents: number
          discount_cents: number
          shipping_cents: number
          total_cents: number
          shipping_method: string | null
          shipping_carrier: string | null
          shipping_service_id: string | null
          shipping_estimated_days: number | null
          shipping_address: Json
          billing_address: Json | null
          coupon_code: string | null
          coupon_id: string | null
          notes: string | null
          internal_notes: string | null
          paid_at: string | null
          shipped_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          user_id?: string | null
          customer_email: string
          customer_name: string
          customer_cpf?: string | null
          customer_phone?: string | null
          status?: Database['public']['Enums']['order_status']
          subtotal_cents: number
          discount_cents?: number
          shipping_cents?: number
          total_cents: number
          shipping_method?: string | null
          shipping_carrier?: string | null
          shipping_service_id?: string | null
          shipping_estimated_days?: number | null
          shipping_address: Json
          billing_address?: Json | null
          coupon_code?: string | null
          coupon_id?: string | null
          notes?: string | null
          internal_notes?: string | null
          paid_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          customer_email?: string
          customer_name?: string
          customer_cpf?: string | null
          customer_phone?: string | null
          status?: Database['public']['Enums']['order_status']
          subtotal_cents?: number
          discount_cents?: number
          shipping_cents?: number
          total_cents?: number
          shipping_method?: string | null
          shipping_carrier?: string | null
          shipping_service_id?: string | null
          shipping_estimated_days?: number | null
          shipping_address?: Json
          billing_address?: Json | null
          coupon_code?: string | null
          coupon_id?: string | null
          notes?: string | null
          internal_notes?: string | null
          paid_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          product_name: string
          product_sku: string
          variant_name: string | null
          product_image_url: string | null
          quantity: number
          unit_price_cents: number
          total_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          variant_id?: string | null
          product_name: string
          product_sku: string
          variant_name?: string | null
          product_image_url?: string | null
          quantity: number
          unit_price_cents: number
          total_cents: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          variant_id?: string | null
          product_name?: string
          product_sku?: string
          variant_name?: string | null
          product_image_url?: string | null
          quantity?: number
          unit_price_cents?: number
          total_cents?: number
          created_at?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          from_status: Database['public']['Enums']['order_status'] | null
          to_status: Database['public']['Enums']['order_status']
          changed_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          from_status?: Database['public']['Enums']['order_status'] | null
          to_status: Database['public']['Enums']['order_status']
          changed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          from_status?: Database['public']['Enums']['order_status'] | null
          to_status?: Database['public']['Enums']['order_status']
          changed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          gateway: string
          gateway_payment_id: string
          method: Database['public']['Enums']['payment_method']
          status: Database['public']['Enums']['payment_status']
          amount_cents: number
          installments: number
          gateway_payload: Json | null
          qr_code: string | null
          qr_code_base64: string | null
          pix_expires_at: string | null
          card_last_four: string | null
          card_brand: string | null
          approved_at: string | null
          rejected_at: string | null
          refunded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          gateway?: string
          gateway_payment_id: string
          method: Database['public']['Enums']['payment_method']
          status?: Database['public']['Enums']['payment_status']
          amount_cents: number
          installments?: number
          gateway_payload?: Json | null
          qr_code?: string | null
          qr_code_base64?: string | null
          pix_expires_at?: string | null
          card_last_four?: string | null
          card_brand?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          gateway?: string
          gateway_payment_id?: string
          method?: Database['public']['Enums']['payment_method']
          status?: Database['public']['Enums']['payment_status']
          amount_cents?: number
          installments?: number
          gateway_payload?: Json | null
          qr_code?: string | null
          qr_code_base64?: string | null
          pix_expires_at?: string | null
          card_last_four?: string | null
          card_brand?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          id: string
          order_id: string
          status: Database['public']['Enums']['shipment_status']
          carrier: string | null
          service: string | null
          tracking_code: string | null
          tracking_url: string | null
          me_label_id: string | null
          me_cart_id: string | null
          label_url: string | null
          label_purchased_at: string | null
          shipping_cents: number
          insurance_cents: number
          posted_at: string | null
          delivered_at: string | null
          estimated_delivery_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status?: Database['public']['Enums']['shipment_status']
          carrier?: string | null
          service?: string | null
          tracking_code?: string | null
          tracking_url?: string | null
          me_label_id?: string | null
          me_cart_id?: string | null
          label_url?: string | null
          label_purchased_at?: string | null
          shipping_cents: number
          insurance_cents?: number
          posted_at?: string | null
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: Database['public']['Enums']['shipment_status']
          carrier?: string | null
          service?: string | null
          tracking_code?: string | null
          tracking_url?: string | null
          me_label_id?: string | null
          me_cart_id?: string | null
          label_url?: string | null
          label_purchased_at?: string | null
          shipping_cents?: number
          insurance_cents?: number
          posted_at?: string | null
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: string
          discount_value: number
          min_purchase_cents: number
          max_discount_cents: number | null
          usage_limit: number | null
          usage_limit_per_user: number | null
          used_count: number
          starts_at: string
          expires_at: string | null
          is_active: boolean
          applies_to_sale_items: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: string
          discount_value: number
          min_purchase_cents?: number
          max_discount_cents?: number | null
          usage_limit?: number | null
          usage_limit_per_user?: number | null
          used_count?: number
          starts_at?: string
          expires_at?: string | null
          is_active?: boolean
          applies_to_sale_items?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          min_purchase_cents?: number
          max_discount_cents?: number | null
          usage_limit?: number | null
          usage_limit_per_user?: number | null
          used_count?: number
          starts_at?: string
          expires_at?: string | null
          is_active?: boolean
          applies_to_sale_items?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          id: string
          coupon_id: string
          order_id: string
          user_id: string | null
          discount_applied_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          order_id: string
          user_id?: string | null
          discount_applied_cents: number
          created_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          order_id?: string
          user_id?: string | null
          discount_applied_cents?: number
          created_at?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          order_id: string | null
          rating: number
          title: string | null
          body: string | null
          is_verified_purchase: boolean
          is_published: boolean
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          order_id?: string | null
          rating: number
          title?: string | null
          body?: string | null
          is_verified_purchase?: boolean
          is_published?: boolean
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          order_id?: string | null
          rating?: number
          title?: string | null
          body?: string | null
          is_verified_purchase?: boolean
          is_published?: boolean
          published_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          image_url: string
          image_url_mobile: string | null
          link_url: string | null
          cta_label: string | null
          position: string
          sort_order: number
          starts_at: string | null
          ends_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          image_url: string
          image_url_mobile?: string | null
          link_url?: string | null
          cta_label?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          image_url?: string
          image_url_mobile?: string | null
          link_url?: string | null
          cta_label?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      shipping_quotes_cache: {
        Row: {
          cache_key: string
          payload: Json
          expires_at: string
          created_at: string
        }
        Insert: {
          cache_key: string
          payload: Json
          expires_at: string
          created_at?: string
        }
        Update: {
          cache_key?: string
          payload?: Json
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          source: string | null
          confirmed_at: string | null
          unsubscribed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          source?: string | null
          confirmed_at?: string | null
          unsubscribed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          source?: string | null
          confirmed_at?: string | null
          unsubscribed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      products_with_default_price: {
        Row: {
          id: string | null
          sku: string | null
          slug: string | null
          name: string | null
          short_description: string | null
          description: string | null
          category_id: string | null
          brand: string | null
          price_cents: number | null
          compare_at_price_cents: number | null
          cost_cents: number | null
          stock: number | null
          low_stock_threshold: number | null
          weight_g: number | null
          width_cm: number | null
          height_cm: number | null
          length_cm: number | null
          is_active: boolean | null
          is_featured: boolean | null
          requires_shipping: boolean | null
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          search_tsv: unknown | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          primary_image_url: string | null
          category_slug: string | null
          category_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_coupon: {
        Args: {
          p_code: string
          p_subtotal_cents: number
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      order_status:
        | 'pending'
        | 'paid'
        | 'processing'
        | 'shipped'
        | 'delivered'
        | 'cancelled'
        | 'refunded'
      payment_status:
        | 'pending'
        | 'in_process'
        | 'approved'
        | 'authorized'
        | 'in_mediation'
        | 'rejected'
        | 'cancelled'
        | 'refunded'
        | 'charged_back'
      payment_method:
        | 'pix'
        | 'credit_card'
        | 'debit_card'
        | 'boleto'
        | 'apple_pay'
        | 'google_pay'
      shipment_status:
        | 'pending'
        | 'label_purchased'
        | 'posted'
        | 'in_transit'
        | 'out_for_delivery'
        | 'delivered'
        | 'returned'
        | 'lost'
      address_type: 'shipping' | 'billing'
      user_role: 'customer' | 'admin' | 'staff'
    }
    CompositeTypes: Record<string, never>
  }
}
