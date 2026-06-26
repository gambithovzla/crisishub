// Tipos de la base de datos CrisisHub.
// Escritos a mano para reflejar supabase/migrations/0001_init.sql.
// Más adelante se pueden regenerar con:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts

export type ModerationStatus = "visible" | "hidden" | "false_info" | "merged";
export type PersonStatus = "desaparecido" | "encontrado_vivo" | "fallecido";
export type ContactMethod =
  | "llamada"
  | "whatsapp"
  | "sms"
  | "presencial"
  | "redes"
  | "otro";
export type EventType =
  | "terremoto"
  | "inundacion"
  | "incendio"
  | "huracan"
  | "deslizamiento"
  | "otro";
export type MarkerType =
  | "hospital"
  | "refugio"
  | "acopio"
  | "agua"
  | "calle_bloqueada"
  | "edificio_colapsado";
export type HelpMode = "necesito" | "ofrezco";
export type HelpCategory =
  | "agua"
  | "comida"
  | "medicinas"
  | "hospedaje"
  | "transporte"
  | "electricidad"
  | "internet"
  | "ropa"
  | "otros";
export type HelpStatus = "pendiente" | "en_proceso" | "resuelta";
export type UserRole = "admin" | "moderador";
export type Profession =
  | "psicologo"
  | "psiquiatra"
  | "medico_general"
  | "pediatra"
  | "enfermeria"
  | "trabajo_social"
  | "nutricion"
  | "fisioterapia"
  | "odontologia"
  | "otro";

export type StaffApplicationStatus = "pendiente" | "aprobado" | "rechazado";

export type FacilityType =
  | "hospital"
  | "clinica"
  | "ambulatorio"
  | "cdi"
  | "modulo"
  | "cruz_roja"
  | "otro";

export type PatientStatus =
  | "ingresado"
  | "en_observacion"
  | "estable"
  | "grave"
  | "alta"
  | "fallecido"
  | "no_identificado";

export type DocumentType =
  | "cedula_v"
  | "cedula_e"
  | "pasaporte"
  | "otro"
  | "sin_documento";

type Timestamps = { created_at: string };

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: number;
          slug: string;
          nombre: string;
          tipo: EventType;
          descripcion: string | null;
          pais: string;
          activo: boolean;
          center_lat: number | null;
          center_lng: number | null;
          center_zoom: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          nombre: string;
          tipo?: EventType;
          descripcion?: string | null;
          pais?: string;
          activo?: boolean;
          center_lat?: number | null;
          center_lng?: number | null;
          center_zoom?: number;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      missing_persons: {
        Row: {
          id: number;
          event_id: number;
          nombre: string;
          apellido: string;
          edad_aprox: number | null;
          foto_url: string | null;
          ciudad: string | null;
          estado_region: string | null;
          descripcion: string | null;
          ultima_lat: number | null;
          ultima_lng: number | null;
          ultima_ubicacion_texto: string | null;
          ultimo_contacto_at: string | null;
          ultimo_contacto_medio: ContactMethod | null;
          ultimo_contacto_actividad: string | null;
          familiar_nombre: string;
          familiar_telefono: string;
          estado: PersonStatus;
          moderation: ModerationStatus;
          merged_into_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id: number;
          nombre: string;
          apellido: string;
          edad_aprox?: number | null;
          foto_url?: string | null;
          ciudad?: string | null;
          estado_region?: string | null;
          descripcion?: string | null;
          ultima_lat?: number | null;
          ultima_lng?: number | null;
          ultima_ubicacion_texto?: string | null;
          ultimo_contacto_at?: string | null;
          ultimo_contacto_medio?: ContactMethod | null;
          ultimo_contacto_actividad?: string | null;
          familiar_nombre: string;
          familiar_telefono: string;
          estado?: PersonStatus;
          moderation?: ModerationStatus;
          merged_into_id?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["missing_persons"]["Insert"]
        >;
        Relationships: [];
      };
      tips: {
        Row: {
          id: number;
          missing_person_id: number;
          nombre: string | null;
          telefono: string | null;
          informacion: string;
          lat: number | null;
          lng: number | null;
          ubicacion_texto: string | null;
          foto_url: string | null;
          moderation: ModerationStatus;
          created_at: string;
        };
        Insert: {
          missing_person_id: number;
          nombre?: string | null;
          telefono?: string | null;
          informacion: string;
          lat?: number | null;
          lng?: number | null;
          ubicacion_texto?: string | null;
          foto_url?: string | null;
          moderation?: ModerationStatus;
        };
        Update: Partial<Database["public"]["Tables"]["tips"]["Insert"]>;
        Relationships: [];
      };
      map_markers: {
        Row: {
          id: number;
          event_id: number;
          tipo: MarkerType;
          descripcion: string | null;
          foto_url: string | null;
          lat: number;
          lng: number;
          usuario: string | null;
          moderation: ModerationStatus;
          created_at: string;
        };
        Insert: {
          event_id: number;
          tipo: MarkerType;
          descripcion?: string | null;
          foto_url?: string | null;
          lat: number;
          lng: number;
          usuario?: string | null;
          moderation?: ModerationStatus;
        };
        Update: Partial<Database["public"]["Tables"]["map_markers"]["Insert"]>;
        Relationships: [];
      };
      help_requests: {
        Row: {
          id: number;
          event_id: number;
          modo: HelpMode;
          categoria: HelpCategory;
          descripcion: string;
          lat: number | null;
          lng: number | null;
          ubicacion_texto: string | null;
          contacto: string | null;
          estado: HelpStatus;
          moderation: ModerationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id: number;
          modo: HelpMode;
          categoria: HelpCategory;
          descripcion: string;
          lat?: number | null;
          lng?: number | null;
          ubicacion_texto?: string | null;
          contacto?: string | null;
          estado?: HelpStatus;
          moderation?: ModerationStatus;
        };
        Update: Partial<
          Database["public"]["Tables"]["help_requests"]["Insert"]
        >;
        Relationships: [];
      };
      volunteers: {
        Row: {
          id: number;
          event_id: number;
          nombre: string;
          profesion: Profession;
          especialidad: string | null;
          modalidades: string[];
          zona: string | null;
          idiomas: string | null;
          bio: string | null;
          contacto: string;
          colegio_numero: string | null;
          credencial_path: string | null;
          verified: boolean;
          moderation: ModerationStatus;
          created_at: string;
        };
        Insert: {
          event_id: number;
          nombre: string;
          profesion?: Profession;
          especialidad?: string | null;
          modalidades?: string[];
          zona?: string | null;
          idiomas?: string | null;
          bio?: string | null;
          contacto: string;
          colegio_numero?: string | null;
          credencial_path?: string | null;
          verified?: boolean;
          moderation?: ModerationStatus;
        };
        Update: Partial<Database["public"]["Tables"]["volunteers"]["Insert"]>;
        Relationships: [];
      };
      collection_points: {
        Row: {
          id: number;
          event_id: number;
          pais: string;
          ciudad: string | null;
          nombre: string;
          direccion: string | null;
          lat: number | null;
          lng: number | null;
          categorias: HelpCategory[];
          instrucciones: string | null;
          horario: string | null;
          contacto: string | null;
          url: string | null;
          activo: boolean;
          moderation: ModerationStatus;
          created_at: string;
        };
        Insert: {
          event_id: number;
          pais: string;
          ciudad?: string | null;
          nombre: string;
          direccion?: string | null;
          lat?: number | null;
          lng?: number | null;
          categorias?: HelpCategory[];
          instrucciones?: string | null;
          horario?: string | null;
          contacto?: string | null;
          url?: string | null;
          activo?: boolean;
          moderation?: ModerationStatus;
        };
        Update: Partial<
          Database["public"]["Tables"]["collection_points"]["Insert"]
        >;
        Relationships: [];
      };
      profiles: {
        Row: { id: string; rol: UserRole; nombre: string | null } & Timestamps;
        Insert: { id: string; rol?: UserRole; nombre?: string | null };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      staff_applications: {
        Row: {
          id: number;
          user_id: string;
          email: string;
          nombre: string;
          mensaje: string | null;
          estado: StaffApplicationStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          nombre: string;
          mensaje?: string | null;
          estado?: StaffApplicationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["staff_applications"]["Insert"]
        >;
        Relationships: [];
      };
      health_facilities: {
        Row: {
          id: number;
          event_id: number;
          nombre: string;
          tipo: FacilityType;
          estado: string | null;
          ciudad: string | null;
          direccion: string | null;
          lat: number | null;
          lng: number | null;
          telefono: string | null;
          capacidad: string | null;
          url: string | null;
          verificado: boolean;
          activo: boolean;
          moderation: ModerationStatus;
          created_at: string;
        };
        Insert: {
          event_id: number;
          nombre: string;
          tipo?: FacilityType;
          estado?: string | null;
          ciudad?: string | null;
          direccion?: string | null;
          lat?: number | null;
          lng?: number | null;
          telefono?: string | null;
          capacidad?: string | null;
          url?: string | null;
          verificado?: boolean;
          activo?: boolean;
          moderation?: ModerationStatus;
        };
        Update: Partial<
          Database["public"]["Tables"]["health_facilities"]["Insert"]
        >;
        Relationships: [];
      };
      patient_records: {
        Row: {
          id: number;
          event_id: number;
          facility_id: number | null;
          facility_nombre: string | null;
          nombre: string;
          documento_tipo: DocumentType;
          documento: string | null;
          documento_norm: string | null;
          edad: number | null;
          sexo: string | null;
          estado: PatientStatus;
          notas: string | null;
          reportante_nombre: string | null;
          reportante_contacto: string | null;
          moderation: ModerationStatus;
          created_at: string;
        };
        Insert: {
          event_id: number;
          facility_id?: number | null;
          facility_nombre?: string | null;
          nombre: string;
          documento_tipo?: DocumentType;
          documento?: string | null;
          edad?: number | null;
          sexo?: string | null;
          estado?: PatientStatus;
          notas?: string | null;
          reportante_nombre?: string | null;
          reportante_contacto?: string | null;
          moderation?: ModerationStatus;
        };
        Update: Partial<
          Database["public"]["Tables"]["patient_records"]["Insert"]
        >;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          accion: string;
          tabla: string;
          registro_id: string | null;
          detalle: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          accion: string;
          tabla: string;
          registro_id?: string | null;
          detalle?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean };
      check_rate_limit: {
        Args: { p_bucket: string; p_max: number; p_window_seconds: number };
        Returns: boolean;
      };
      listar_voluntarios: {
        Args: { prof?: string };
        Returns: {
          id: number;
          nombre: string;
          profesion: Profession;
          especialidad: string | null;
          modalidades: string[];
          zona: string | null;
          idiomas: string | null;
          bio: string | null;
          contacto: string;
          colegio_numero: string | null;
          created_at: string;
        }[];
      };
      buscar_pacientes: {
        Args: { q?: string; fac?: number | null };
        Returns: {
          id: number;
          nombre: string;
          facility_id: number | null;
          facility_nombre: string | null;
          estado: PatientStatus;
          edad: number | null;
          sexo: string | null;
          documento_tipo: DocumentType;
          documento_masked: string | null;
          created_at: string;
        }[];
      };
    };
    Enums: {
      moderation_status: ModerationStatus;
      person_status: PersonStatus;
      contact_method: ContactMethod;
      event_type: EventType;
      marker_type: MarkerType;
      help_mode: HelpMode;
      help_category: HelpCategory;
      help_status: HelpStatus;
      user_role: UserRole;
      staff_application_status: StaffApplicationStatus;
      facility_type: FacilityType;
      patient_status: PatientStatus;
      document_type: DocumentType;
    };
  };
}

// Atajos útiles para el resto de la app.
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type EventRow = Tables<"events">;
export type MissingPerson = Tables<"missing_persons">;
export type Tip = Tables<"tips">;
export type MapMarker = Tables<"map_markers">;
export type HelpRequest = Tables<"help_requests">;
export type CollectionPoint = Tables<"collection_points">;
export type Volunteer = Tables<"volunteers">;
export type VolunteerPublic =
  Database["public"]["Functions"]["listar_voluntarios"]["Returns"][number];
export type Profile = Tables<"profiles">;
export type StaffApplication = Tables<"staff_applications">;
export type HealthFacility = Tables<"health_facilities">;
export type PatientRecord = Tables<"patient_records">;
export type PatientPublic =
  Database["public"]["Functions"]["buscar_pacientes"]["Returns"][number];
