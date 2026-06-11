alter type public.prospect_note_type add value if not exists 'observacao';
alter type public.prospect_note_type add value if not exists 'reuniao';
alter type public.prospect_note_type add value if not exists 'decisao';
alter type public.prospect_note_type add value if not exists 'risco';

alter type public.prospect_activity_type add value if not exists 'diagnostic_updated';
