import type {
  PaginatedResponse,
  CityList,
  CityDetail,
  VillageList,
  VillageDetail,
  SiteSettings,
} from '~/types/village'

/**
 * Composable for fetching data from the Tourism Villages API.
 * Automatically sends Accept-Language header from current i18n locale.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const { locale } = useI18n()

  const apiBase = config.public.apiBase as string

  /**
   * Fetch paginated list of cities.
   */
  function fetchCities() {
    return useFetch<PaginatedResponse<CityList>>('/cities/', {
      baseURL: apiBase,
      headers: { 'Accept-Language': locale.value },
      key: `cities-${locale.value}`,
      watch: [locale],
    })
  }

  /**
   * Fetch single city by slug (includes its villages).
   */
  function fetchCityBySlug(slug: string) {
    return useFetch<CityDetail>(`/cities/${slug}/`, {
      baseURL: apiBase,
      headers: { 'Accept-Language': locale.value },
      key: `city-${slug}-${locale.value}`,
      watch: [locale],
    })
  }

  /**
   * Fetch villages filtered by city slug.
   */
  function fetchVillagesByCity(citySlug: string) {
    return useFetch<PaginatedResponse<VillageList>>('/villages/', {
      baseURL: apiBase,
      headers: { 'Accept-Language': locale.value },
      params: { city: citySlug },
      key: `villages-${citySlug}-${locale.value}`,
      watch: [locale],
    })
  }

  /**
   * Fetch single village by slug (includes gallery & comments).
   */
  function fetchVillageBySlug(slug: string) {
    return useFetch<VillageDetail>(`/villages/${slug}/`, {
      baseURL: apiBase,
      headers: { 'Accept-Language': locale.value },
      key: `village-${slug}-${locale.value}`,
      watch: [locale],
    })
  }

  /**
   * Fetch site settings (about section content).
   */
  function fetchSettings() {
    return useFetch<SiteSettings>('/settings/', {
      baseURL: apiBase,
      headers: { 'Accept-Language': locale.value },
      key: `settings-${locale.value}`,
      watch: [locale],
    })
  }

  return {
    fetchCities,
    fetchCityBySlug,
    fetchVillagesByCity,
    fetchVillageBySlug,
    fetchSettings,
  }
}
